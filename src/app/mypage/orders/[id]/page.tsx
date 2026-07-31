import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { OrderDetailView } from "@/components/commerce/OrderDetailView";
import { OrderCancelButton } from "@/components/commerce/OrderCancelButton";
import { OrderCsRequestForm } from "@/components/commerce/OrderCsRequestForm";
import { createClient } from "@/lib/supabase/server";
import { orderStatusLabel, paymentMethodLabel } from "@/lib/orders";
import { parseShippingAddress } from "@/lib/shippingAddress";
import {
  csRequestStatusLabel,
  csRequestTypeLabel,
  OPEN_CS_STATUSES,
} from "@/lib/csRequests";

interface MyOrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function MyOrderDetailPage({ params }: MyOrderDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=/mypage/orders/${id}`);
  }

  const { data: order } = await supabase
    .from("orders")
    .select(
      "id, order_number, status, currency, total, shipping_fee, subtotal, customer_name, customer_email, customer_phone, shipping_message, shipping_address, payment_method, cancel_reason, cancelled_at, refunded_at, refunded_amount, tracking_courier, tracking_number, created_at",
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!order) notFound();

  const [{ data: items }, { data: csRequests }] = await Promise.all([
    supabase
      .from("order_items")
      .select("title, size, quantity, unit_price, currency, image_url")
      .eq("order_id", order.id),
    supabase
      .from("order_cs_requests")
      .select("id, request_type, status, reason, admin_note, exchange_size, created_at, resolved_at")
      .eq("order_id", order.id)
      .order("created_at", { ascending: false }),
  ]);

  const shipping = parseShippingAddress(order.shipping_address);
  const hasOpenRequest = (csRequests ?? []).some((r) =>
    (OPEN_CS_STATUSES as readonly string[]).includes(r.status),
  );

  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-12 pb-24 md:px-6">
        <div className="mb-8">
          <Link
            href="/mypage/orders"
            className="text-[10px] uppercase tracking-widest text-muted underline"
          >
            ← 주문내역
          </Link>
          <h1 className="mt-2 text-xl font-medium uppercase tracking-wider">주문상세</h1>
          <p className="mt-2 text-sm text-muted">
            {orderStatusLabel(order.status)} ·{" "}
            {new Date(order.created_at).toLocaleString("ko-KR")}
          </p>
        </div>

        <OrderDetailView
          order={{
            orderNumber: order.order_number,
            statusLabel: orderStatusLabel(order.status),
            paymentMethod: paymentMethodLabel(order.payment_method),
            customerName: order.customer_name,
            customerEmail: order.customer_email,
            customerPhone: order.customer_phone,
            shippingMessage: order.shipping_message,
            shipping,
            currency: order.currency,
            subtotal: order.subtotal,
            shippingFee: order.shipping_fee,
            total: order.total,
            trackingCourier: order.tracking_courier,
            trackingNumber: order.tracking_number,
            items: items ?? [],
          }}
          showActions={false}
        />

        {(order.cancel_reason || order.refunded_at) && (
          <section className="mt-8 border border-border p-5 text-sm">
            <h2 className="font-medium">취소/환불 정보</h2>
            {order.cancel_reason && <p className="mt-2">사유: {order.cancel_reason}</p>}
            {order.cancelled_at && (
              <p className="mt-1 text-muted">
                취소일: {new Date(order.cancelled_at).toLocaleString("ko-KR")}
              </p>
            )}
            {order.refunded_at && (
              <p className="mt-1 text-muted">
                환불일: {new Date(order.refunded_at).toLocaleString("ko-KR")}
                {order.refunded_amount != null && (
                  <> · 환불액 {order.refunded_amount} {order.currency}</>
                )}
              </p>
            )}
          </section>
        )}

        {(csRequests ?? []).length > 0 && (
          <section className="mt-8 border border-border p-5 text-sm">
            <h2 className="font-medium">CS 요청 현황</h2>
            <ul className="mt-4 space-y-3">
              {(csRequests ?? []).map((req) => (
                <li key={req.id} className="border-t border-border pt-3 first:border-0 first:pt-0">
                  <p className="font-medium">
                    {csRequestTypeLabel(req.request_type)} · {csRequestStatusLabel(req.status)}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {new Date(req.created_at).toLocaleString("ko-KR")}
                  </p>
                  <p className="mt-2">사유: {req.reason}</p>
                  {req.exchange_size && (
                    <p className="mt-1 text-muted">희망 사이즈: {req.exchange_size}</p>
                  )}
                  {req.admin_note && (
                    <p className="mt-1 text-muted">관리자: {req.admin_note}</p>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        <OrderCancelButton orderId={order.id} status={order.status} />
        <OrderCsRequestForm
          orderId={order.id}
          status={order.status}
          hasOpenRequest={hasOpenRequest}
        />
      </main>
      <Footer />
    </>
  );
}
