"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { OrderDetailView, type OrderDetailData } from "@/components/commerce/OrderDetailView";
import { useCart } from "@/context/CartContext";
import { createClient } from "@/lib/supabase/client";

export default function CheckoutSuccessPage() {
  return (
    <>
      <Header />
      <main className="min-h-[70vh] bg-[#0a0a0a] px-4 py-12 text-neutral-100 sm:px-8">
        <div className="mx-auto max-w-3xl">
          <Suspense fallback={<p className="text-sm text-neutral-500">결제 확인 중...</p>}>
            <SuccessClient />
          </Suspense>
        </div>
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
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => setIsLoggedIn(!!data.user));
  }, []);

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
    return <p className="text-sm text-neutral-500">결제를 확인하고 있습니다...</p>;
  }

  if (status === "error") {
    return (
      <div className="border border-[#262626] bg-[#151515] p-8 text-center">
        <h1 className="text-xl font-bold">결제 확인 실패</h1>
        <p className="mt-3 text-sm text-rose-400">{message}</p>
        <Link href="/checkout" className="mt-6 inline-block text-xs text-[#FEE500] underline">
          다시 시도
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 border border-[#262626] bg-[#151515] p-8 text-center">
        <h1 className="text-2xl font-bold">주문이 완료됐어요</h1>
        <p className="mt-3 text-sm text-neutral-400">
          실물 상품은 평일 기준 매일 오후 3시 전후 우체국택배로 출고됩니다.
        </p>
        {order?.orderNumber ? (
          <p className="mt-4 text-sm">
            주문번호 <strong className="text-[#FEE500]">{order.orderNumber}</strong>
          </p>
        ) : null}
        {!isLoggedIn ? (
          <div className="mt-5 border border-[#333] bg-[#0c0c0c] p-4 text-left text-xs text-neutral-400">
            <p className="font-medium text-neutral-200">비회원 주문 안내</p>
            <p className="mt-2">
              주문자 이름 · 주문번호 · 주문 비밀번호를 꼭 저장해 두세요. (별도 문자/메일 발송은 하지
              않습니다.)
            </p>
            <Link href="/order-inquiry" className="mt-3 inline-block text-[#FEE500] underline">
              주문조회 바로가기
            </Link>
          </div>
        ) : null}
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {isLoggedIn ? (
            <Link
              href="/mypage/orders"
              className="bg-[#f4f1ea] px-5 py-3 text-sm font-semibold text-black"
            >
              주문 상세 보기
            </Link>
          ) : (
            <Link
              href="/order-inquiry"
              className="bg-[#f4f1ea] px-5 py-3 text-sm font-semibold text-black"
            >
              주문 조회하기
            </Link>
          )}
          <Link
            href="/sale"
            className="border border-[#333] px-5 py-3 text-sm text-white"
          >
            쇼핑 계속
          </Link>
        </div>
      </div>
      {order ? <OrderDetailView order={order} /> : null}
    </div>
  );
}
