"use client";

import { Suspense, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export default function CheckoutFailPage() {
  return (
    <>
      <Header />
      <main className="flex min-h-[70vh] items-center justify-center bg-[#0a0a0a] px-4 py-20 text-neutral-100">
        <Suspense fallback={null}>
          <FailClient />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}

function FailClient() {
  const params = useSearchParams();
  const code = params.get("code");
  const message = params.get("message");
  const orderId = params.get("orderId");

  useEffect(() => {
    if (!orderId) return;
    fetch("/api/orders/release-stock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tossOrderId: orderId }),
    }).catch(() => undefined);
  }, [orderId]);

  return (
    <div className="w-full max-w-lg border border-[#262626] bg-[#151515] p-8 text-center">
      <h1 className="text-2xl font-bold">결제가 완료되지 않았어요</h1>
      <p className="mt-3 text-sm text-neutral-400">
        {message || code || "다시 시도해 주세요."}
      </p>
      <p className="mt-4 text-xs text-neutral-500">
        장바구니 상품은 그대로 남아 있습니다.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/checkout/auth"
          className="bg-[#f4f1ea] px-5 py-3 text-sm font-semibold text-black"
        >
          다시 결제하기
        </Link>
        <Link href="/cart" className="border border-[#333] px-5 py-3 text-sm">
          장바구니로
        </Link>
      </div>
    </div>
  );
}
