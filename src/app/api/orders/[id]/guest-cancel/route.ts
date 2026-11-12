import { NextResponse } from "next/server";
import {
  CANCELLABLE_PAID_STATUSES,
  CANCELLABLE_PENDING_STATUSES,
  isMemberCancellableStatus,
} from "@/lib/orders";
import { createServiceClient } from "@/lib/supabase/service";
import { stockErrorMessage } from "@/lib/stock";
import { cancelTossPayment, orderTotalToTossCancelAmount } from "@/lib/toss";
import { verifyGuestPassword } from "@/lib/guestPassword";

type RouteContext = { params: Promise<{ id: string }> };

/** 비회원 — 배송 전 셀프 취소 (주문 비밀번호 인증) */
export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = (await request.json().catch(() => ({}))) as {
      password?: string;
      reason?: string;
    };
    const password = body.password ?? "";
    const reason = body.reason?.trim() || "구매자 주문 취소";

    if (!password) {
      return NextResponse.json({ message: "주문 비밀번호가 필요합니다." }, { status: 400 });
    }

    const admin = createServiceClient();
    if (!admin) {
      return NextResponse.json(
        { message: "SUPABASE_SERVICE_ROLE_KEY가 필요합니다." },
        { status: 503 },
      );
    }

    const { data: order } = await admin
      .from("orders")
      .select(
        "id, user_id, status, order_number, total, currency, toss_payment_key, refunded_amount, guest_password_hash",
      )
      .eq("id", id)
      .maybeSingle();

    if (!order || order.user_id) {
      return NextResponse.json({ message: "비회원 주문을 찾을 수 없습니다." }, { status: 404 });
    }

    if (!order.guest_password_hash) {
      return NextResponse.json({ message: "주문 비밀번호 정보가 없습니다." }, { status: 400 });
    }
    const ok = await verifyGuestPassword(password, order.guest_password_hash);
    if (!ok) {
      return NextResponse.json({ message: "주문 비밀번호가 올바르지 않습니다." }, { status: 403 });
    }

    if (!isMemberCancellableStatus(order.status)) {
      return NextResponse.json(
        {
          message:
            "배송이 시작된 주문은 직접 취소할 수 없습니다. 반품/환불 요청을 이용해 주세요.",
        },
        { status: 400 },
      );
    }

    const now = new Date().toISOString();

    if ((CANCELLABLE_PENDING_STATUSES as readonly string[]).includes(order.status)) {
      const { error: releaseError } = await admin.rpc("release_stock_for_order", {
        p_order_id: id,
      });
      if (releaseError) {
        return NextResponse.json({ message: stockErrorMessage(releaseError) }, { status: 500 });
      }

      await admin
        .from("orders")
        .update({
          status: "cancelled",
          cancel_reason: reason,
          cancelled_at: now,
        })
        .eq("id", id);

      return NextResponse.json({
        ok: true,
        orderNumber: order.order_number,
        status: "cancelled",
        refunded: false,
      });
    }

    if ((CANCELLABLE_PAID_STATUSES as readonly string[]).includes(order.status)) {
      if (!order.toss_payment_key) {
        return NextResponse.json(
          { message: "결제 정보가 없어 자동 환불을 진행할 수 없습니다. 고객센터로 문의해 주세요." },
          { status: 400 },
        );
      }

      const cancelAmount = orderTotalToTossCancelAmount(order.total, order.currency);
      const tossResult = await cancelTossPayment({
        paymentKey: order.toss_payment_key,
        settlementCurrency: order.currency,
        cancelReason: reason,
        cancelAmount,
        idempotencyKey: `guest-cancel-${order.id}`,
      });

      if (!tossResult.ok) {
        return NextResponse.json(
          { message: tossResult.message, code: tossResult.code },
          { status: 400 },
        );
      }

      const { error: stockError } = await admin.rpc("restore_stock_for_paid_order", {
        p_order_id: id,
      });
      if (stockError) {
        return NextResponse.json(
          {
            message: `환불은 완료되었으나 재고 복구에 실패했습니다. 고객센터로 문의해 주세요. (${stockErrorMessage(stockError)})`,
            refunded: true,
          },
          { status: 500 },
        );
      }

      const newRefundedAmount = (order.refunded_amount ?? 0) + cancelAmount;
      await admin
        .from("orders")
        .update({
          status: "refunded",
          cancel_reason: reason,
          cancelled_at: now,
          refunded_at: now,
          refunded_amount: newRefundedAmount,
        })
        .eq("id", id);

      return NextResponse.json({
        ok: true,
        orderNumber: order.order_number,
        status: "refunded",
        refunded: true,
        cancelAmount,
      });
    }

    return NextResponse.json({ message: "취소할 수 없는 주문입니다." }, { status: 400 });
  } catch (error: unknown) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "서버 오류" },
      { status: 500 },
    );
  }
}
