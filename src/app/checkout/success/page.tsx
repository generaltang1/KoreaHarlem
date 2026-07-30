"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { OrderDetailView, type OrderDetailData } from "@/components/commerce/OrderDetailView";
import { useCart } from "@/context/CartContext";

export default function CheckoutSuccessPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-12">
        <Suspense fallback={<p className="text-sm text-muted">결제 확인 중...</p>}>
          <SuccessClient />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}

function SuccessClient() {
  const params = useSearchParams();
  const { clearCart } = useCart();
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [message, setMessage] = useState("");
  const [order, setOrder] = useState<OrderDetailData | null>(null);

  useEffect(() => {
    const paymentKey = params.get("paymentKey");
    const orderId = params.get("orderId");
    const amount = params.get("amount");

    if (!paymentKey || !orderId || !amount) {
      setStatus("error");
      setMessage("결제 정보가 없습니다.");
      return;
    }

    fetch("/api/payments/toss/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        paymentKey,
        orderId,
        amount: Number(amount),
      }),
    })
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.message || "승인 실패");
        clearCart();
        if (json.order) {
          setOrder({
            orderNumber: json.order.orderNumber,
            statusLabel: "결제완료",
            paymentMethod: json.order.paymentMethod,
            customerName: json.order.customerName,
            customerEmail: json.order.customerEmail,
            customerPhone: json.order.customerPhone,
            shippingMessage: json.order.shippingMessage,
            shippingAddress: json.order.shippingAddress,
            currency: json.order.currency,
            total: json.order.total,
            shippingFee: json.order.shippingFee,
            items: json.order.items ?? [],
          });
        }
        setStatus("ok");
      })
      .catch((err: unknown) => {
        setStatus("error");
        setMessage(err instanceof Error ? err.message : "승인 실패");
      });
  }, [params, clearCart]);

  if (status === "loading") {
    return <p className="text-sm text-muted">결제를 확인하고 있습니다...</p>;
  }

  if (status === "error") {
    return (
      <div className="text-center">
        <h1 className="text-xl font-medium">결제 확인 실패</h1>
        <p className="mt-3 text-sm text-rose-500">{message}</p>
        <Link href="/checkout" className="mt-6 inline-block text-xs uppercase tracking-widest underline">
          다시 시도
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 text-center">
        <h1 className="text-xl font-medium">주문이 완료되었습니다</h1>
        <p className="mt-2 text-sm text-muted">주문해 주셔서 감사합니다.</p>
        {order?.orderNumber && (
          <p className="mt-3 text-sm">
            주문번호: <strong>{order.orderNumber}</strong>
          </p>
        )}
        {!order?.orderNumber && (
          <p className="mt-3 text-xs text-muted">
            비회원 주문은 주문조회에서 주문번호로 확인할 수 있습니다.
          </p>
        )}
      </div>
      {order && <OrderDetailView order={order} />}
      {!order && (
        <div className="text-center">
          <Link href="/sale" className="text-xs uppercase tracking-widest underline">
            Sale로 돌아가기
          </Link>
        </div>
      )}
    </div>
  );
}
