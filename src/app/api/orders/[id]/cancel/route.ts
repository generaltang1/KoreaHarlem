import { NextResponse } from "next/server";
import {
  CANCELLABLE_PAID_STATUSES,
  CANCELLABLE_PENDING_STATUSES,
  isMemberCancellableStatus,
} from "@/lib/orders";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { stockErrorMessage } from "@/lib/stock";
import { cancelTossPayment, orderTotalToTossCancelAmount } from "@/lib/toss";

type RouteContext = { params: Promise<{ id: string }> };

/** 회원 본인 주문 — 배송 전 셀프 취소 */
export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = (await request.json().catch(() => ({}))) as { reason?: string };
    const reason = body.reason?.trim() || "구매자 주문 취소";

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
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
        "id, user_id, status, order_number, total, currency, toss_payment_key, refunded_amount",
      )
      .eq("id", id)
      .maybeSingle();

    if (!order || order.user_id !== user.id) {
      return NextResponse.json({ message: "주문을 찾을 수 없습니다." }, { status: 404 });
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

    // 결제 대기: 재고 복구 + 취소
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

    // 결제완료·배송준비중: 토스 전액 환불 + 재고 복구
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
        idempotencyKey: `member-cancel-${order.id}`,
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
