"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { OrderDetailView, type OrderDetailData } from "@/components/commerce/OrderDetailView";
import { OrderCancelRefundSection } from "@/components/commerce/OrderCancelRefundSection";
import {
  OrderCsRequestsSection,
  type OrderCsRequestItem,
} from "@/components/commerce/OrderCsRequestsSection";
import { GuestOrderCancelButton } from "@/components/commerce/GuestOrderCancelButton";
import { canRequestCs, OPEN_CS_STATUSES } from "@/lib/csRequests";
import { mp } from "@/lib/mypageTheme";

interface GuestOrderItem {
  id: string;
  product_id: string | null;
  title: string;
  size: string | null;
  quantity: number;
  unit_price: number;
  currency: string;
  image_url: string | null;
}

interface GuestOrderData extends OrderDetailData {
  id: string;
  status: string;
  cancelReason?: string | null;
  cancelledAt?: string | null;
  refundedAt?: string | null;
  refundedAmount?: number | null;
  csRequests?: OrderCsRequestItem[];
  items: GuestOrderItem[];
}

export default function OrderInquiryPage() {
  const [name, setName] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState<GuestOrderData | null>(null);

  const lookupOrder = async () => {
    const res = await fetch("/api/orders/lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        orderNumber: orderNumber.trim(),
        password,
      }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "조회 실패");
    setOrder(json.order);
    try {
      sessionStorage.setItem(
        "kh_guest_order_lookup",
        JSON.stringify({
          orderId: json.order.id,
          name: name.trim(),
          orderNumber: orderNumber.trim(),
          password,
        }),
      );
    } catch {
      /* ignore */
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setOrder(null);
    setLoading(true);
    try {
      await lookupOrder();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "조회 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const hasOpenRequest =
    order?.csRequests?.some((r) => (OPEN_CS_STATUSES as readonly string[]).includes(r.status)) ??
    false;

  return (
    <>
      <Header />
      <main className={`${mp.page} px-4 py-12 sm:px-8`}>
        <div className="mx-auto max-w-3xl">
          <h1 className="text-2xl font-bold">비회원 주문조회</h1>
          <p className={`mt-2 text-sm ${mp.muted}`}>
            주문 시 입력한 이름 · 주문번호 · 비밀번호로 조회합니다. 주문번호를 잊으셨다면{" "}
            <Link href="/contact" className="text-[#FEE500] underline">
              고객센터
            </Link>
            로 문의해 주세요.
          </p>

          <form onSubmit={handleSubmit} className={`${mp.card} mt-8 space-y-4 p-5`}>
            <div>
              <label className={mp.label}>주문자명 *</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className={mp.input}
              />
            </div>
            <div>
              <label className={mp.label}>주문번호 *</label>
              <input
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="KH-20261014-0001"
                required
                className={mp.input}
              />
            </div>
            <div>
              <label className={mp.label}>주문 비밀번호 *</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={mp.input}
              />
            </div>
            {error ? <p className="text-sm text-rose-400">{error}</p> : null}
            <button type="submit" disabled={loading} className={`w-full ${mp.creamBtn}`}>
              {loading ? "조회 중..." : "주문조회"}
            </button>
          </form>

          {order ? (
            <div className="mt-10">
              <OrderDetailView order={order} showActions={false} />
              <OrderCancelRefundSection
                cancelReason={order.cancelReason}
                cancelledAt={order.cancelledAt}
                refundedAt={order.refundedAt}
                refundedAmount={order.refundedAmount}
                currency={order.currency}
              />
              <GuestOrderCancelButton
                orderId={order.id}
                status={order.status}
                password={password}
                onSuccess={async () => {
                  try {
                    await lookupOrder();
                  } catch (err: unknown) {
                    setError(err instanceof Error ? err.message : "취소 후 갱신 실패");
                  }
                }}
              />
              {canRequestCs(order.status) ? (
                <div className={`${mp.card} mt-6 p-5`}>
                  <h2 className="text-sm font-semibold">교환 · 반품</h2>
                  <p className={`mt-2 text-xs ${mp.muted}`}>
                    배송 완료 후 교환·반품을 신청할 수 있습니다.
                  </p>
                  {hasOpenRequest ? (
                    <p className="mt-3 text-xs text-amber-200">처리 중인 요청이 있습니다.</p>
                  ) : (
                    <Link
                      href={`/mypage/orders/${order.id}/claim`}
                      className={`mt-4 ${mp.creamBtn}`}
                    >
                      교환·반품 신청
                    </Link>
                  )}
                </div>
              ) : null}
              <OrderCsRequestsSection requests={order.csRequests ?? []} />
              <div className="mt-8 text-center">
                <Link href="/sale" className="text-xs text-[#FEE500] underline">
                  쇼핑 계속하기
                </Link>
              </div>
            </div>
          ) : null}
        </div>
      </main>
      <Footer />
    </>
  );
}
