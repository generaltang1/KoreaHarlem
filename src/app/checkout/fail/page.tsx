"use client";

import { Suspense, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CommerceAtmosphere } from "@/components/mypage/CommerceAtmosphere";
import { mp } from "@/lib/mypageTheme";

export default function CheckoutFailPage() {
  return (
    <>
      <Header />
      <CommerceAtmosphere className="flex min-h-[70vh] items-center justify-center px-4 py-20">
        <Suspense fallback={null}>
          <FailClient />
        </Suspense>
      </CommerceAtmosphere>
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

  const failDetail = [code, message].filter(Boolean).join(" · ") || null;

  return (
    <div className={`w-full max-w-lg ${mp.card} p-8 text-center`}>
      <h1 className="text-[28px] font-bold tracking-tight">주문이 완료되지 않았어요</h1>
      <p className={`mt-3 text-sm ${mp.muted}`}>
        결제가 승인되지 않았어요. 장바구니 상품은 그대로 남아 있으니 다시 시도해주세요.
      </p>

      <div className="mt-6 space-y-4 rounded-[10px] border border-[rgba(244,241,234,0.12)] bg-[rgba(244,241,234,0.04)] p-4 text-left">
        <div>
          <p className="text-[11px] font-medium text-[#a8a49b]">실패 사유</p>
          <p className="mt-2 rounded-[8px] border border-rose-500/30 bg-rose-500/10 px-3 py-2.5 text-xs leading-relaxed text-rose-200">
            {failDetail || "[토스페이먼츠가 보내준 실패 코드·메시지 그대로 표시]"}
          </p>
        </div>
        <div>
          <p className="text-[11px] font-medium text-[#a8a49b]">자주 있는 경우</p>
          <ul className={`mt-2 list-disc space-y-1 pl-4 text-xs ${mp.muted}`}>
            <li>결제창을 닫았거나 뒤로 가기를 눌렀어요</li>
            <li>카드사 인증을 끝내지 못했어요</li>
            <li>카드 한도·잔액이 부족해요</li>
          </ul>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/checkout/auth" className={mp.creamBtn}>
          다시 결제하기
        </Link>
        <Link href="/cart" className={mp.ghostBtn}>
          장바구니로
        </Link>
      </div>
      <p className={`mt-5 text-[11px] leading-relaxed ${mp.tertiary}`}>
        같은 오류가 반복되면 고객센터 (koreaharlem@gmail.com · 010-5828-5171)로 알려주세요.
      </p>
    </div>
  );
}
