import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { OrderDetailView } from "@/components/commerce/OrderDetailView";
import { OrderCancelButton } from "@/components/commerce/OrderCancelButton";
import { OrderCancelRefundSection } from "@/components/commerce/OrderCancelRefundSection";
import { OrderCsRequestsSection, type OrderCsRequestItem } from "@/components/commerce/OrderCsRequestsSection";
import { OrderCsRequestForm } from "@/components/commerce/OrderCsRequestForm";
import { createClient } from "@/lib/supabase/server";
import { orderStatusLabel, paymentMethodLabel } from "@/lib/orders";
import { parseShippingAddress } from "@/lib/shippingAddress";
import { OPEN_CS_STATUSES } from "@/lib/csRequests";

interface MyOrderDetailPageProps {
  params: Promise<{ id: string }>;
}

const EXTENDED_CS_SELECT =
  "id, request_type, status, reason, admin_note, exchange_size, order_item_id, hold_size, hold_quantity, stock_held_at, stock_released_at, stock_completed_at, created_at, resolved_at";
const BASIC_CS_SELECT =
  "id, request_type, status, reason, admin_note, exchange_size, created_at, resolved_at";

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

  const { data: items } = await supabase
    .from("order_items")
    .select("id, product_id, title, size, quantity, unit_price, currency, image_url")
    .eq("order_id", order.id);

  let csRequests: Record<string, unknown>[] | null = null;
  const { data: extendedRows, error: csError } = await supabase
    .from("order_cs_requests")
    .select(EXTENDED_CS_SELECT)
    .eq("order_id", order.id)
    .order("created_at", { ascending: false });

  if (csError) {
    // add_exchange_stock_hold.sql이 아직 실행되지 않은 경우 기본 컬럼으로 폴백
    const { data: basicRows } = await supabase
      .from("order_cs_requests")
      .select(BASIC_CS_SELECT)
      .eq("order_id", order.id)
      .order("created_at", { ascending: false });
    csRequests = basicRows;
  } else {
    csRequests = extendedRows;
  }

  const itemsById = new Map((items ?? []).map((item) => [item.id, item]));
  const enrichedCsRequests: OrderCsRequestItem[] = (csRequests ?? []).map((req) => {
    const orderItemId = req.order_item_id as string | undefined;
    const item = orderItemId ? itemsById.get(orderItemId) : undefined;
    return {
      ...(req as unknown as OrderCsRequestItem),
      item_title: item?.title ?? null,
      item_size: item?.size ?? null,
    };
  });

  const shipping = parseShippingAddress(order.shipping_address);
  const hasOpenRequest = enrichedCsRequests.some((r) =>
    (OPEN_CS_STATUSES as readonly string[]).includes(r.status),
  );
  const formItems = (items ?? []).map((item) => ({
    id: item.id,
    product_id: item.product_id,
    title: item.title,
    size: item.size,
  }));

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

        <OrderCancelRefundSection
          cancelReason={order.cancel_reason}
          cancelledAt={order.cancelled_at}
          refundedAt={order.refunded_at}
          refundedAmount={order.refunded_amount}
          currency={order.currency}
        />

        <OrderCsRequestsSection requests={enrichedCsRequests} />

        <OrderCancelButton orderId={order.id} status={order.status} />
        <OrderCsRequestForm
          orderId={order.id}
          status={order.status}
          hasOpenRequest={hasOpenRequest}
          items={formItems}
        />
      </main>
      <Footer />
    </>
  );
}
