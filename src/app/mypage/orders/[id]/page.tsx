import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { MypageShell } from "@/components/mypage/MypageShell";
import { OrderDetailView } from "@/components/commerce/OrderDetailView";
import { OrderCancelButton } from "@/components/commerce/OrderCancelButton";
import { OrderCancelRefundSection } from "@/components/commerce/OrderCancelRefundSection";
import { OrderCsRequestsSection, type OrderCsRequestItem } from "@/components/commerce/OrderCsRequestsSection";
import { createClient } from "@/lib/supabase/server";
import { orderStatusLabel, paymentMethodLabel } from "@/lib/orders";
import { parseShippingAddress } from "@/lib/shippingAddress";
import { canRequestCs, OPEN_CS_STATUSES } from "@/lib/csRequests";
import { mp } from "@/lib/mypageTheme";

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

  return (
    <MypageShell
      title="주문 상세"
      subtitle={`${orderStatusLabel(order.status)} · ${new Date(order.created_at).toLocaleString("ko-KR")}`}
    >
      <Link href="/mypage/orders" className={`mb-4 inline-block text-xs ${mp.muted} underline`}>
        ← 주문 내역
      </Link>

      <div className="space-y-2 text-sm text-neutral-400">
        <p>배송 전: 주문 전체 취소 가능 · 결제수단으로 환불 · 재고 복구</p>
        <p>배송 후: 수령일부터 7일 이내 교환·반품 신청</p>
      </div>

      <div className="mt-6">
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
      </div>

      <OrderCancelRefundSection
        cancelReason={order.cancel_reason}
        cancelledAt={order.cancelled_at}
        refundedAt={order.refunded_at}
        refundedAmount={order.refunded_amount}
        currency={order.currency}
      />

      <OrderCsRequestsSection requests={enrichedCsRequests} />

      <div id="cancel">
        <OrderCancelButton orderId={order.id} status={order.status} />
      </div>

      {canRequestCs(order.status) ? (
        <section className={`${mp.card} mt-8 p-5`}>
          <h2 className="text-sm font-semibold">교환 · 반품</h2>
          <p className={`mt-2 text-xs ${mp.muted}`}>
            배송 완료 후 교환·반품을 신청할 수 있습니다. 단순 변심 반품 배송비 ₩4,000.
          </p>
          {hasOpenRequest ? (
            <p className="mt-3 text-xs text-amber-200">처리 중인 요청이 있습니다. 아래 진행 상태를 확인해 주세요.</p>
          ) : (
            <Link href={`/mypage/orders/${order.id}/claim`} className={`mt-4 ${mp.creamBtn}`}>
              교환·반품 신청
            </Link>
          )}
        </section>
      ) : null}
    </MypageShell>
  );
}
