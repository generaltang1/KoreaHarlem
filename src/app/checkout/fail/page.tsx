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
      <main className="mx-auto max-w-xl px-4 py-20 text-center">
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
    <div>
      <h1 className="text-xl font-medium">결제가 취소되었거나 실패했습니다</h1>
      <p className="mt-3 text-sm text-muted">{message || code || "다시 시도해주세요."}</p>
      <Link href="/checkout" className="mt-6 inline-block text-xs uppercase tracking-widest underline">
        결제 다시하기
      </Link>
    </div>
  );
}
