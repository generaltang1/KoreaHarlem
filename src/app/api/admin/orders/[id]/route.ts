import { NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/adminApi";
import { createServiceClient } from "@/lib/supabase/admin";
import { paymentMethodLabel, orderStatusLabel } from "@/lib/orders";
import { parseShippingAddress } from "@/lib/shippingAddress";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const auth = await assertAdminApi();
  if (auth.error) return auth.error;

  const { id } = await context.params;
  const admin = createServiceClient();
  if (!admin) {
    return NextResponse.json({ message: "SUPABASE_SERVICE_ROLE_KEY가 필요합니다." }, { status: 503 });
  }

  const { data: order, error } = await admin
    .from("orders")
    .select(
      "id, order_number, status, currency, total, shipping_fee, subtotal, customer_name, customer_email, customer_phone, shipping_message, shipping_address, payment_method, toss_order_id, toss_payment_key, cancel_reason, cancelled_at, refunded_at, refunded_amount, tracking_courier, tracking_number, prepared_at, shipped_at, delivered_at, created_at",
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !order) {
    return NextResponse.json({ message: "주문을 찾을 수 없습니다." }, { status: 404 });
  }

  const { data: items } = await admin
    .from("order_items")
    .select("title, size, quantity, unit_price, currency, image_url")
    .eq("order_id", id);

  const { data: csRequests } = await admin
    .from("order_cs_requests")
    .select(
      "id, request_type, status, reason, admin_note, exchange_size, created_at, resolved_at",
    )
    .eq("order_id", id)
    .order("created_at", { ascending: false });
  // table may not exist until add_order_cs_requests.sql is run

  const shipping = parseShippingAddress(order.shipping_address);

  return NextResponse.json({
    order: {
      ...order,
      statusLabel: orderStatusLabel(order.status),
      paymentMethodLabel: paymentMethodLabel(order.payment_method),
      shipping,
      items: items ?? [],
      csRequests: csRequests ?? [],
    },
  });
}
