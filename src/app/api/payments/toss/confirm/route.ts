import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { getTossSecretKey } from "@/lib/toss";

export async function POST(request: Request) {
  try {
    const { paymentKey, orderId, amount } = await request.json();
    if (!paymentKey || !orderId || amount == null) {
      return NextResponse.json({ message: "paymentKey, orderId, amount 필요" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: order } = await supabase
      .from("orders")
      .select("id, currency, order_number, customer_name, total, shipping_fee, payment_method, shipping_address, customer_phone, customer_email, shipping_message")
      .eq("toss_order_id", orderId)
      .maybeSingle();

    const settlementCurrency = order?.currency ?? "KRW";
    const secretKey = getTossSecretKey(settlementCurrency);
    if (!secretKey) {
      return NextResponse.json(
        {
          message: isForeignHint(settlementCurrency)
            ? "TOSS_FOREIGN_SECRET_KEY(또는 TOSS_SECRET_KEY) 미설정"
            : "TOSS_SECRET_KEY 미설정",
        },
        { status: 500 },
      );
    }

    const confirmRes = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${secretKey}:`).toString("base64")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ paymentKey, orderId, amount }),
    });

    const payment = await confirmRes.json();
    if (!confirmRes.ok) {
      return NextResponse.json(
        { message: payment.message || "결제 승인 실패", code: payment.code },
        { status: 400 },
      );
    }

    await supabase
      .from("orders")
      .update({
        status: "paid",
        toss_payment_key: paymentKey,
      })
      .eq("toss_order_id", orderId);

    let items: { title: string; size: string | null; quantity: number; unit_price: number; currency: string; image_url: string | null }[] = [];
    if (order?.id) {
      const itemClient = createServiceClient() ?? supabase;
      const { data: orderItems } = await itemClient
        .from("order_items")
        .select("title, size, quantity, unit_price, currency, image_url")
        .eq("order_id", order.id);
      items = orderItems ?? [];
    }

    return NextResponse.json({
      ok: true,
      payment,
      order: order
        ? {
            orderNumber: order.order_number,
            customerName: order.customer_name,
            customerEmail: order.customer_email,
            customerPhone: order.customer_phone,
            shippingMessage: order.shipping_message,
            shippingAddress: order.shipping_address,
            paymentMethod: order.payment_method,
            total: order.total,
            shippingFee: order.shipping_fee,
            currency: order.currency,
            items,
          }
        : null,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "서버 오류" },
      { status: 500 },
    );
  }
}

function isForeignHint(currency: string) {
  return currency === "USD" || currency === "JPY";
}
