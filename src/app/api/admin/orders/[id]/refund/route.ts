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
  const alreadyRefunded = order.refunded_amount ?? 0;
  const remaining = Math.max(0, fullCancelAmount - alreadyRefunded);

  if (remaining <= 0) {
    return NextResponse.json({ message: "이미 전액 환불된 주문입니다." }, { status: 400 });
  }

  const cancelAmount =
    body.cancelAmount != null && body.cancelAmount > 0 ? body.cancelAmount : remaining;

  if (cancelAmount > remaining) {
    return NextResponse.json(
      {
        message: `환불 가능 잔액(${remaining} ${order.currency})을 초과합니다. 이미 환불: ${alreadyRefunded}`,
      },
      { status: 400 },
    );
  }

  const tossResult = await cancelTossPayment({
    paymentKey: order.toss_payment_key,
    settlementCurrency: order.currency,
    cancelReason: reason,
    cancelAmount,
    idempotencyKey: `refund-${order.id}-${alreadyRefunded}-${cancelAmount}`,
  });

  if (!tossResult.ok) {
    return NextResponse.json(
      { message: tossResult.message, code: tossResult.code },
      { status: 400 },
    );
  }

  const newRefundedAmount = alreadyRefunded + cancelAmount;
  const isFullRefund = newRefundedAmount >= fullCancelAmount;

  if (restoreStock && isFullRefund) {
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

  const now = new Date().toISOString();
  await admin
    .from("orders")
    .update({
      status: isFullRefund ? "refunded" : order.status,
      cancel_reason: reason,
      refunded_at: now,
      refunded_amount: newRefundedAmount,
      ...(isFullRefund ? { cancelled_at: now } : {}),
    })
    .eq("id", id);

  await admin.from("order_status_histories").insert({
    order_id: id,
    from_status: order.status,
    to_status: isFullRefund ? "refunded" : order.status,
    changed_by: auth.user.id,
    reason: isFullRefund
      ? `전액 환불 ${cancelAmount} ${order.currency}`
      : `부분 환불 ${cancelAmount} ${order.currency} (누적 ${newRefundedAmount}/${fullCancelAmount})`,
  });

  return NextResponse.json({
    ok: true,
    orderNumber: order.order_number,
    status: isFullRefund ? "refunded" : order.status,
    cancelAmount,
    refundedAmount: newRefundedAmount,
    remainingAmount: Math.max(0, fullCancelAmount - newRefundedAmount),
    stockRestored: restoreStock && isFullRefund,
    payment: tossResult.payment,
  });
}
