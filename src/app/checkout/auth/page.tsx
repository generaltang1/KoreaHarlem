"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { createClient } from "@/lib/supabase/client";
import { signInWithGoogle, signInWithKakao } from "@/lib/auth/oauth";
import { GoogleMark, KakaoMark } from "@/components/auth/OAuthIcons";

function CheckoutAuthInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [checking, setChecking] = useState(true);
  const [guestName, setGuestName] = useState("");
  const [guestPassword, setGuestPassword] = useState("");
  const [guestPasswordConfirm, setGuestPasswordConfirm] = useState("");
  const [guestError, setGuestError] = useState("");

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

  const handleGuest = (e: FormEvent) => {
    e.preventDefault();
    setGuestError("");
    if (!guestName.trim()) {
      setGuestError("주문자 이름을 입력해 주세요.");
      return;
    }
    if (guestPassword.length < 8) {
      setGuestError("주문 비밀번호는 8자 이상이어야 합니다.");
      return;
    }
    if (guestPassword !== guestPasswordConfirm) {
      setGuestError("비밀번호 확인이 일치하지 않습니다.");
      return;
    }
    try {
      sessionStorage.setItem(
        "kh_guest_checkout",
        JSON.stringify({ name: guestName.trim(), password: guestPassword }),
      );
    } catch {
      /* ignore */
    }
    router.push(checkoutUrl);
  };

  if (checking) {
    return <p className="text-sm text-neutral-500">확인 중...</p>;
  }

  return (
    <div className="w-full max-w-md text-neutral-100">
      <div className="mb-8 text-center">
        <p className="text-[10px] uppercase tracking-widest text-neutral-500">Checkout</p>
        <h1 className="mt-1 text-2xl font-bold">주문하기</h1>
        <p className="mt-2 text-xs text-neutral-400">
          로그인하면 마이페이지·배송·교환/반품을 한눈에 볼 수 있습니다.
        </p>
      </div>

      <div className="space-y-3 rounded-xl border border-[#262626] bg-[#151515] p-6">
        <button
          type="button"
          onClick={async () => {
            await signInWithKakao(supabase);
          }}
          className="flex w-full items-center justify-center gap-3 bg-[#FEE500] py-3 text-sm font-semibold text-[#191919]"
        >
          <KakaoMark />
          Kakao로 로그인
        </button>
        <button
          type="button"
          onClick={async () => {
            await signInWithGoogle(supabase);
          }}
          className="flex w-full items-center justify-center gap-3 border border-[#333] py-3 text-sm"
        >
          <GoogleMark />
          Google로 로그인
        </button>
        <Link
          href={`/login?next=${encodeURIComponent(autopayUrl)}`}
          className="block w-full border border-[#333] bg-[#1c1c1c] py-3 text-center text-sm"
        >
          이메일로 로그인
        </Link>
      </div>

      <form
        onSubmit={handleGuest}
        className="mt-6 space-y-3 rounded-xl border border-[#262626] bg-[#151515] p-6"
      >
        <h2 className="text-sm font-semibold">비회원으로 주문하기</h2>
        <p className="text-xs text-amber-200/90">
          비회원은 마이페이지·MY MUSIC을 이용할 수 없고, 음원 구매는 회원만 가능합니다.
        </p>
        <div>
          <label className="mb-1.5 block text-[10px] uppercase tracking-widest text-neutral-500">
            주문자 이름
          </label>
          <input
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            className="w-full border border-[#333] bg-[#0c0c0c] px-3 py-3 text-sm outline-none focus:border-white"
            required
          />
        </div>
        <div>
          <label className="mb-1.5 block text-[10px] uppercase tracking-widest text-neutral-500">
            주문 비밀번호
          </label>
          <input
            type="password"
            value={guestPassword}
            onChange={(e) => setGuestPassword(e.target.value)}
            className="w-full border border-[#333] bg-[#0c0c0c] px-3 py-3 text-sm outline-none focus:border-white"
            minLength={8}
            required
          />
          <p className="mt-1 text-[10px] text-neutral-500">8자 이상 · 주문조회 시 사용</p>
        </div>
        <div>
          <label className="mb-1.5 block text-[10px] uppercase tracking-widest text-neutral-500">
            비밀번호 확인
          </label>
          <input
            type="password"
            value={guestPasswordConfirm}
            onChange={(e) => setGuestPasswordConfirm(e.target.value)}
            className="w-full border border-[#333] bg-[#0c0c0c] px-3 py-3 text-sm outline-none focus:border-white"
            required
          />
        </div>
        {guestError ? <p className="text-sm text-rose-400">{guestError}</p> : null}
        <button
          type="submit"
          className="w-full bg-[#f4f1ea] py-3.5 text-sm font-semibold text-black"
        >
          비회원으로 주문하기
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-neutral-500">
        계정이 없으신가요?{" "}
        <Link href={`/signup?next=${encodeURIComponent(autopayUrl)}`} className="text-[#FEE500] underline">
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
      <main className="flex min-h-[70vh] items-center justify-center bg-[#0a0a0a] px-4 py-16">
        <Suspense fallback={<p className="text-sm text-neutral-500">불러오는 중...</p>}>
          <CheckoutAuthInner />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
