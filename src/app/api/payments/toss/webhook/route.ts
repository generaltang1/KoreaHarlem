import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { fetchTossPayment } from "@/lib/toss";
import { stockErrorMessage } from "@/lib/stock";

type WebhookBody = {
  eventType?: string;
  createdAt?: string;
  data?: {
    paymentKey?: string;
    orderId?: string;
    status?: string;
    secret?: string;
    cancels?: { cancelAmount?: number }[];
    [key: string]: unknown;
  };
};

/**
 * 토스페이먼츠 웹훅
 * 등록 URL: https://korea-harlem.vercel.app/api/payments/toss/webhook
 * 이벤트: PAYMENT_STATUS_CHANGED, CANCEL_STATUS_CHANGED
 *
 * 검증: paymentKey로 결제 조회 API 재호출 (공식 권장)
 */
export async function POST(request: Request) {
  let body: WebhookBody;
  try {
    body = (await request.json()) as WebhookBody;
  } catch {
    return NextResponse.json({ message: "invalid json" }, { status: 400 });
  }

  const eventType = body.eventType ?? "";
  const data = body.data ?? {};
  const paymentKey = typeof data.paymentKey === "string" ? data.paymentKey : "";
  const orderIdFromEvent = typeof data.orderId === "string" ? data.orderId : "";

  // 알 수 없는 이벤트는 200으로 종료 (재시도 폭풍 방지)
  if (
    eventType !== "PAYMENT_STATUS_CHANGED" &&
    eventType !== "CANCEL_STATUS_CHANGED" &&
    eventType !== "DEPOSIT_CALLBACK"
  ) {
    return NextResponse.json({ ok: true, ignored: eventType || "unknown" });
  }

  if (!paymentKey && !orderIdFromEvent) {
    return NextResponse.json({ ok: true, ignored: "no paymentKey/orderId" });
  }

  const admin = createServiceClient();
  if (!admin) {
    // 토스가 재시도하도록 5xx
    return NextResponse.json({ message: "SUPABASE_SERVICE_ROLE_KEY 필요" }, { status: 503 });
  }

  // 주문 찾기
  let order: {
    id: string;
    status: string;
    currency: string;
    total: number;
    toss_order_id: string | null;
    toss_payment_key: string | null;
    refunded_amount: number | null;
    order_number: string | null;
  } | null = null;

  if (paymentKey) {
    const { data } = await admin
      .from("orders")
      .select(
        "id, status, currency, total, toss_order_id, toss_payment_key, refunded_amount, order_number",
      )
      .eq("toss_payment_key", paymentKey)
      .maybeSingle();
    order = data;
  }
  if (!order && orderIdFromEvent) {
    const { data } = await admin
      .from("orders")
      .select(
        "id, status, currency, total, toss_order_id, toss_payment_key, refunded_amount, order_number",
      )
      .eq("toss_order_id", orderIdFromEvent)
      .maybeSingle();
    order = data;
  }

  if (!order) {
    // 우리 DB에 없는 결제 — 성공 응답으로 재시도 중단
    return NextResponse.json({ ok: true, ignored: "order_not_found" });
  }

  const keyToFetch = paymentKey || order.toss_payment_key;
  if (!keyToFetch) {
    return NextResponse.json({ ok: true, ignored: "no_payment_key_yet" });
  }

  // 1차 KRW, 실패 시 주문 currency로 재조회
  let verified = await fetchTossPayment(keyToFetch, order.currency || "KRW");
  if (!verified.ok && order.currency !== "KRW") {
    verified = await fetchTossPayment(keyToFetch, "KRW");
  }
  if (!verified.ok) {
    // 조회 실패는 재시도 유도
    return NextResponse.json({ message: verified.message }, { status: 502 });
  }

  const payment = verified.payment;
  const tossStatus = payment.status;
  const now = new Date().toISOString();
  const canceledSum =
    payment.cancels?.reduce((sum, c) => sum + (c.cancelAmount ?? 0), 0) ?? 0;

  try {
    if (tossStatus === "DONE") {
      if (order.status === "pending" || order.status === "paid") {
        const patch: Record<string, unknown> = {
          toss_payment_key: payment.paymentKey,
        };
        if (order.status === "pending") {
          patch.status = "paid";
        }
        await admin.from("orders").update(patch).eq("id", order.id);
        if (order.status === "pending") {
          await admin.from("order_status_histories").insert({
            order_id: order.id,
            from_status: order.status,
            to_status: "paid",
            reason: `토스 웹훅: ${eventType} DONE`,
          });
        }
      }
      return NextResponse.json({ ok: true, synced: "DONE", orderId: order.id });
    }

    if (tossStatus === "CANCELED") {
      if (order.status !== "refunded" && order.status !== "cancelled") {
        await admin
          .from("orders")
          .update({
            status: "refunded",
            toss_payment_key: payment.paymentKey,
            refunded_at: now,
            refunded_amount: canceledSum || order.refunded_amount,
            cancelled_at: now,
            cancel_reason: order.status === "pending" ? "토스 결제 취소" : "토스 전액 취소(웹훅)",
          })
          .eq("id", order.id);

        await admin.from("order_status_histories").insert({
          order_id: order.id,
          from_status: order.status,
          to_status: "refunded",
          reason: `토스 웹훅: ${eventType} CANCELED`,
        });

        // 결제완료 이후 전액 취소면 재고 복구 시도 (이미 복구됐을 수 있음 — RPC가 허용 상태일 때만)
        if (["paid", "preparing", "shipped", "delivered"].includes(order.status)) {
          const { error: stockError } = await admin.rpc("restore_stock_for_paid_order", {
            p_order_id: order.id,
          });
          if (stockError) {
            console.error("[toss webhook] stock restore:", stockErrorMessage(stockError));
          }
        } else if (order.status === "pending") {
          await admin.rpc("release_stock_for_order", { p_order_id: order.id });
        }
      }
      return NextResponse.json({ ok: true, synced: "CANCELED", orderId: order.id });
    }

    if (tossStatus === "PARTIAL_CANCELED") {
      await admin
        .from("orders")
        .update({
          toss_payment_key: payment.paymentKey,
          refunded_at: now,
          refunded_amount: canceledSum,
          cancel_reason: "토스 부분 취소(웹훅)",
        })
        .eq("id", order.id);

      await admin.from("order_status_histories").insert({
        order_id: order.id,
        from_status: order.status,
        to_status: order.status,
        reason: `토스 웹훅: PARTIAL_CANCELED (누적 ${canceledSum})`,
      });
      return NextResponse.json({ ok: true, synced: "PARTIAL_CANCELED", orderId: order.id });
    }

    if (tossStatus === "EXPIRED" || tossStatus === "ABORTED") {
      if (order.status === "pending") {
        await admin.rpc("release_stock_for_order", { p_order_id: order.id });
        await admin
          .from("orders")
          .update({
            status: "cancelled",
            cancel_reason: `토스 ${tossStatus}`,
            cancelled_at: now,
            toss_payment_key: payment.paymentKey || order.toss_payment_key,
          })
          .eq("id", order.id);
        await admin.from("order_status_histories").insert({
          order_id: order.id,
          from_status: "pending",
          to_status: "cancelled",
          reason: `토스 웹훅: ${tossStatus}`,
        });
      }
      return NextResponse.json({ ok: true, synced: tossStatus, orderId: order.id });
    }

    return NextResponse.json({ ok: true, synced: tossStatus, orderId: order.id });
  } catch (error: unknown) {
    console.error("[toss webhook]", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "webhook error" },
      { status: 500 },
    );
  }
}

/** 토스 헬스체크용 */
export async function GET() {
  return NextResponse.json({
    ok: true,
    endpoint: "/api/payments/toss/webhook",
    events: ["PAYMENT_STATUS_CHANGED", "CANCEL_STATUS_CHANGED", "DEPOSIT_CALLBACK"],
  });
}
