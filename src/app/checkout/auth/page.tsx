"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { createClient } from "@/lib/supabase/client";
import { signInWithGoogle, signInWithKakao } from "@/lib/auth/oauth";

function CheckoutAuthInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [checking, setChecking] = useState(true);

  const checkoutQuery = searchParams.toString();
  const checkoutUrl = `/checkout?${checkoutQuery}`;
  const autopayUrl = `/checkout?${checkoutQuery}${checkoutQuery ? "&" : ""}autopay=1`;

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        router.replace(autopayUrl);
      } else {
        setChecking(false);
      }
    });
  }, [router, autopayUrl, supabase.auth]);

  const handleGuest = () => {
    router.push(checkoutUrl);
  };

  if (checking) {
    return <p className="text-sm text-muted">확인 중...</p>;
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 text-center">
        <p className="text-[10px] uppercase tracking-widest text-muted">Checkout</p>
        <h1 className="mt-1 text-xl font-medium uppercase tracking-wider">로그인</h1>
        <p className="mt-2 text-xs text-muted">회원 로그인 후 바로 결제하거나, 비회원으로 구매할 수 있습니다.</p>
      </div>

      <div className="space-y-3">
        <button
          type="button"
          onClick={async () => {
            await signInWithGoogle(supabase);
          }}
          className="flex w-full items-center justify-center gap-3 border border-border py-3 text-xs"
        >
          Google로 로그인
        </button>
        <button
          type="button"
          onClick={async () => {
            await signInWithKakao(supabase);
          }}
          className="flex w-full items-center justify-center gap-3 border border-[#FEE500] bg-[#FEE500] py-3 text-xs"
        >
          Kakao로 로그인
        </button>
      </div>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-[10px] uppercase tracking-widest text-muted">또는</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <Link
        href={`/login?next=${encodeURIComponent(autopayUrl)}`}
        className="block w-full bg-foreground py-3 text-center text-xs uppercase tracking-widest text-background"
      >
        이메일로 로그인
      </Link>

      <button
        type="button"
        onClick={handleGuest}
        className="mt-3 w-full border border-border py-3 text-xs uppercase tracking-widest"
      >
        비회원 구매
      </button>
      <p className="mt-2 text-center text-[10px] text-muted">
        비회원 구매 시 주문조회 비밀번호를 설정해야 합니다.
      </p>

      <p className="mt-6 text-center text-xs text-muted">
        계정이 없으신가요?{" "}
        <Link href={`/signup?next=${encodeURIComponent(autopayUrl)}`} className="underline">
          회원가입
        </Link>
      </p>
    </div>
  );
}

export default function CheckoutAuthPage() {
  return (
    <>
      <Header />
      <main className="flex min-h-[70vh] items-center justify-center px-4 py-16">
        <Suspense fallback={<p className="text-sm text-muted">불러오는 중...</p>}>
          <CheckoutAuthInner />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
