import { NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/adminApi";
import { REFUNDABLE_STATUSES } from "@/lib/orders";
import { createServiceClient } from "@/lib/supabase/admin";
import { stockErrorMessage } from "@/lib/stock";
import { cancelTossPayment, orderTotalToTossCancelAmount } from "@/lib/toss";

type RouteContext = { params: Promise<{ id: string }> };

/** 결제 완료 주문 환불 (토스 API + 재고 복구) */
export async function POST(request: Request, context: RouteContext) {
  const auth = await assertAdminApi();
  if (auth.error) return auth.error;

  const { id } = await context.params;
  const body = (await request.json()) as {
    reason?: string;
    cancelAmount?: number;
    restoreStock?: boolean;
  };

  const reason = body.reason?.trim();
  if (!reason) {
    return NextResponse.json({ message: "환불 사유를 입력해주세요." }, { status: 400 });
  }

  const restoreStock = body.restoreStock !== false;

  const admin = createServiceClient();
  if (!admin) {
    return NextResponse.json({ message: "SUPABASE_SERVICE_ROLE_KEY가 필요합니다." }, { status: 503 });
  }

  const { data: order } = await admin
    .from("orders")
    .select(
      "id, status, order_number, total, currency, toss_payment_key, refunded_amount",
    )
    .eq("id", id)
    .maybeSingle();

  if (!order) {
    return NextResponse.json({ message: "주문을 찾을 수 없습니다." }, { status: 404 });
  }

  if (!REFUNDABLE_STATUSES.includes(order.status as (typeof REFUNDABLE_STATUSES)[number])) {
    return NextResponse.json(
      { message: `현재 상태(${order.status})에서는 환불할 수 없습니다.` },
      { status: 400 },
    );
  }

  if (!order.toss_payment_key) {
    return NextResponse.json({ message: "결제 키가 없어 토스 환불을 진행할 수 없습니다." }, { status: 400 });
  }

  const fullCancelAmount = orderTotalToTossCancelAmount(order.total, order.currency);
  const cancelAmount =
    body.cancelAmount != null && body.cancelAmount > 0
      ? body.cancelAmount
      : fullCancelAmount;

  if (cancelAmount > fullCancelAmount) {
    return NextResponse.json({ message: "환불 금액이 결제 금액을 초과합니다." }, { status: 400 });
  }

  const tossResult = await cancelTossPayment({
    paymentKey: order.toss_payment_key,
    settlementCurrency: order.currency,
    cancelReason: reason,
    cancelAmount,
    idempotencyKey: `refund-${order.id}-${cancelAmount}`,
  });

  if (!tossResult.ok) {
    return NextResponse.json(
      { message: tossResult.message, code: tossResult.code },
      { status: 400 },
    );
  }

  if (restoreStock && cancelAmount >= fullCancelAmount) {
    const { error: stockError } = await admin.rpc("restore_stock_for_paid_order", {
      p_order_id: id,
    });
    if (stockError) {
      return NextResponse.json(
        {
          message: `토스 환불은 완료되었으나 재고 복구 실패: ${stockErrorMessage(stockError)}`,
          refunded: true,
        },
        { status: 500 },
      );
    }
  }

  const isFullRefund = cancelAmount >= fullCancelAmount;
  const newRefundedAmount = (order.refunded_amount ?? 0) + cancelAmount;

  await admin
    .from("orders")
    .update({
      status: isFullRefund ? "refunded" : order.status,
      cancel_reason: reason,
      refunded_at: new Date().toISOString(),
      refunded_amount: newRefundedAmount,
      ...(isFullRefund ? { cancelled_at: new Date().toISOString() } : {}),
    })
    .eq("id", id);

  return NextResponse.json({
    ok: true,
    orderNumber: order.order_number,
    status: isFullRefund ? "refunded" : order.status,
    cancelAmount,
    stockRestored: restoreStock && isFullRefund,
    payment: tossResult.payment,
  });
}
