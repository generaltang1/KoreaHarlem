"use client";

import Link from "next/link";
import { formatMinorAmount, getCurrency } from "@/lib/currency";
import { paymentMethodLabel } from "@/lib/orders";
import { parseShippingAddress } from "@/lib/shippingAddress";
import { mp } from "@/lib/mypageTheme";

export interface OrderDetailItem {
  title: string;
  size: string | null;
  quantity: number;
  unit_price: number;
  currency: string;
  image_url?: string | null;
}

export interface OrderDetailData {
  orderNumber: string | null;
  statusLabel?: string;
  paymentMethod?: string | null;
  customerName?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
  shippingMessage?: string | null;
  shippingAddress?: unknown;
  shipping?: ReturnType<typeof parseShippingAddress>;
  currency?: string;
  subtotal?: number;
  shippingFee?: number;
  total?: number;
  trackingCourier?: string | null;
  trackingNumber?: string | null;
  items: OrderDetailItem[];
}

function formatOrderMoney(amount: number, currencyCode: string) {
  return formatMinorAmount(amount, getCurrency(currencyCode));
}

export function OrderDetailView({
  order,
  showActions = true,
}: {
  order: OrderDetailData;
  showActions?: boolean;
}) {
  const shipping = order.shipping ?? parseShippingAddress(order.shippingAddress);
  const payLabel =
    typeof order.paymentMethod === "string" && order.paymentMethod.includes("_")
      ? paymentMethodLabel(order.paymentMethod)
      : (order.paymentMethod ?? "-");
  const currency = order.currency ?? "KRW";

  return (
    <div className="space-y-5 text-left text-[#f4f1ea]">
      <section className={`${mp.card} p-5`}>
        <h2 className="text-sm font-semibold">주문 정보</h2>
        <dl className="mt-4 space-y-2 text-sm">
          {order.orderNumber && (
            <div className="flex gap-4">
              <dt className={`w-24 shrink-0 ${mp.muted}`}>주문번호</dt>
              <dd className="font-medium">{order.orderNumber}</dd>
            </div>
          )}
          {order.statusLabel && (
            <div className="flex gap-4">
              <dt className={`w-24 shrink-0 ${mp.muted}`}>주문상태</dt>
              <dd className={mp.accent}>{order.statusLabel}</dd>
            </div>
          )}
          <div className="flex gap-4">
            <dt className={`w-24 shrink-0 ${mp.muted}`}>결제수단</dt>
            <dd>{payLabel}</dd>
          </div>
          {order.total != null && (
            <div className="flex gap-4">
              <dt className={`w-24 shrink-0 ${mp.muted}`}>결제금액</dt>
              <dd className="font-medium">{formatOrderMoney(order.total, currency)}</dd>
            </div>
          )}
        </dl>
      </section>

      <section className={`${mp.card} p-5`}>
        <h2 className="text-sm font-semibold">배송지 · 배송조회</h2>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex gap-4">
            <dt className={`w-24 shrink-0 ${mp.muted}`}>받는사람</dt>
            <dd>{order.customerName}</dd>
          </div>
          <div className="flex gap-4">
            <dt className={`w-24 shrink-0 ${mp.muted}`}>연락처</dt>
            <dd>{shipping?.phone || order.customerPhone || "-"}</dd>
          </div>
          <div className="flex gap-4">
            <dt className={`w-24 shrink-0 ${mp.muted}`}>이메일</dt>
            <dd>{order.customerEmail || "-"}</dd>
          </div>
          <div className="flex gap-4">
            <dt className={`w-24 shrink-0 ${mp.muted}`}>주소</dt>
            <dd>
              {shipping
                ? `[${shipping.postcode}] ${shipping.address} ${shipping.addressDetail}`.trim()
                : "-"}
            </dd>
          </div>
          {(shipping?.message || order.shippingMessage) && (
            <div className="flex gap-4">
              <dt className={`w-24 shrink-0 ${mp.muted}`}>배송메시지</dt>
              <dd>{shipping?.message || order.shippingMessage}</dd>
            </div>
          )}
          {(order.trackingCourier || order.trackingNumber) && (
            <>
              <div className="flex gap-4">
                <dt className={`w-24 shrink-0 ${mp.muted}`}>택배사</dt>
                <dd>{order.trackingCourier || "-"}</dd>
              </div>
              <div className="flex gap-4">
                <dt className={`w-24 shrink-0 ${mp.muted}`}>송장번호</dt>
                <dd className="font-medium">{order.trackingNumber || "-"}</dd>
              </div>
            </>
          )}
        </dl>
      </section>

      <section className={`${mp.card} p-5`}>
        <h2 className="text-sm font-semibold">주문상품</h2>
        <ul className={`mt-4 ${mp.divide} divide-y`}>
          {order.items.map((item, i) => (
            <li key={i} className="flex gap-4 py-3 text-sm">
              {item.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.image_url}
                  alt=""
                  className="h-16 w-16 shrink-0 rounded-[6px] object-cover"
                />
              ) : null}
              <div className="min-w-0 flex-1">
                <p className="font-medium">{item.title}</p>
                {item.size ? <p className={`text-xs ${mp.muted}`}>사이즈: {item.size}</p> : null}
                <p className={`text-xs ${mp.muted}`}>수량: {item.quantity}</p>
              </div>
              <p className="shrink-0">
                {formatOrderMoney(item.unit_price * item.quantity, item.currency)}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {order.total != null ? (
        <section className={`${mp.card} p-5`}>
          <h2 className="text-sm font-semibold">결제정보</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className={mp.muted}>상품금액</dt>
              <dd>
                {formatOrderMoney(
                  (order.subtotal ?? order.total) - (order.shippingFee ?? 0),
                  currency,
                )}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className={mp.muted}>배송비</dt>
              <dd>
                {(order.shippingFee ?? 0) > 0
                  ? `${(order.shippingFee ?? 0).toLocaleString("ko-KR")}원`
                  : "무료"}
              </dd>
            </div>
            <div className="flex justify-between border-t border-[rgba(244,241,234,0.12)] pt-3 font-medium">
              <dt>총 결제금액</dt>
              <dd>{formatOrderMoney(order.total, currency)}</dd>
            </div>
          </dl>
        </section>
      ) : null}

      {showActions ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/order-inquiry" className={mp.ghostBtn}>
            주문확인하기
          </Link>
          <Link href="/sale" className={mp.creamBtn}>
            쇼핑 계속하기
          </Link>
        </div>
      ) : null}
    </div>
  );
}
