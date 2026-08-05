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

interface GuestOrderData extends OrderDetailData {
  cancelReason?: string | null;
  cancelledAt?: string | null;
  refundedAt?: string | null;
  refundedAmount?: number | null;
  csRequests?: OrderCsRequestItem[];
}

export default function OrderInquiryPage() {
  const [name, setName] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState<GuestOrderData | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setOrder(null);
    setLoading(true);
    try {
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
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "조회 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-xl font-medium uppercase tracking-wider">주문조회</h1>
        <p className="mt-2 text-sm text-muted">
          비회원 주문의 경우 주문 시 입력한 이름, 주문번호, 비밀번호로 조회할 수 있습니다.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4 border border-border p-5">
          <div>
            <label className="mb-1.5 block text-[10px] uppercase tracking-widest text-muted">
              주문자명 *
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full border border-border px-4 py-3 text-sm outline-none focus:border-foreground"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[10px] uppercase tracking-widest text-muted">
              주문번호 *
            </label>
            <input
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="20240730-0000019"
              required
              className="w-full border border-border px-4 py-3 text-sm outline-none focus:border-foreground"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[10px] uppercase tracking-widest text-muted">
              비회원 주문 비밀번호 *
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border border-border px-4 py-3 text-sm outline-none focus:border-foreground"
            />
          </div>
          {error && <p className="text-sm text-rose-500">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-foreground py-3 text-xs uppercase tracking-widest text-background disabled:opacity-50"
          >
            {loading ? "조회 중..." : "주문조회"}
          </button>
        </form>

        {order && (
          <div className="mt-10">
            <OrderDetailView order={order} showActions={false} />
            <OrderCancelRefundSection
              cancelReason={order.cancelReason}
              cancelledAt={order.cancelledAt}
              refundedAt={order.refundedAt}
              refundedAmount={order.refundedAmount}
              currency={order.currency}
            />
            <OrderCsRequestsSection requests={order.csRequests ?? []} />
            <div className="mt-8 text-center">
              <Link href="/sale" className="text-xs uppercase tracking-widest underline">
                쇼핑 계속하기
              </Link>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
