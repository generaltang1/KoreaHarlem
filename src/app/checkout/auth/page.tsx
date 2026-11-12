"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CommerceAtmosphere } from "@/components/mypage/CommerceAtmosphere";
import { createClient } from "@/lib/supabase/client";
import { signInWithGoogle, signInWithKakao } from "@/lib/auth/oauth";
import { GoogleMark, KakaoMark } from "@/components/auth/OAuthIcons";
import { mp } from "@/lib/mypageTheme";

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
    return <p className={`text-sm ${mp.muted}`}>확인 중...</p>;
  }

  return (
    <div className="w-full max-w-md text-[#f4f1ea]">
      <div className="mb-8 text-center">
        <p className={`text-[10px] uppercase tracking-widest ${mp.tertiary}`}>Checkout</p>
        <h1 className="mt-1 text-[28px] font-bold tracking-tight">주문하기</h1>
        <p className={`mt-2 text-xs ${mp.muted}`}>
          로그인하면 마이페이지·배송·교환/반품을 한눈에 볼 수 있습니다.
        </p>
      </div>

      <div className={`space-y-3 ${mp.card} p-6`}>
        <button
          type="button"
          onClick={async () => {
            await signInWithKakao(supabase);
          }}
          className="flex w-full items-center justify-center gap-3 rounded-[8px] bg-[#FEE500] py-3 text-sm font-semibold text-[#191919]"
        >
          <KakaoMark />
          Kakao로 로그인
        </button>
        <button
          type="button"
          onClick={async () => {
            await signInWithGoogle(supabase);
          }}
          className={`${mp.ghostBtn} w-full gap-3 py-3`}
        >
          <GoogleMark />
          Google로 로그인
        </button>
        <Link
          href={`/login?next=${encodeURIComponent(autopayUrl)}`}
          className={`${mp.ghostBtn} block w-full py-3 text-center`}
        >
          이메일로 로그인
        </Link>
      </div>

      <form onSubmit={handleGuest} className={`mt-6 space-y-3 ${mp.card} p-6`}>
        <h2 className="text-sm font-semibold">비회원으로 주문하기</h2>
        <p className="text-xs text-amber-200/90">
          비회원은 마이페이지·MY MUSIC을 이용할 수 없고, 음원 구매는 회원만 가능합니다.
        </p>
        <div>
          <label className={mp.label}>주문자 이름</label>
          <input
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            className={mp.input}
            required
          />
        </div>
        <div>
          <label className={mp.label}>주문 비밀번호</label>
          <input
            type="password"
            value={guestPassword}
            onChange={(e) => setGuestPassword(e.target.value)}
            className={mp.input}
            minLength={8}
            required
          />
          <p className={`mt-1 text-[10px] ${mp.tertiary}`}>8자 이상 · 주문조회 시 사용</p>
        </div>
        <div>
          <label className={mp.label}>비밀번호 확인</label>
          <input
            type="password"
            value={guestPasswordConfirm}
            onChange={(e) => setGuestPasswordConfirm(e.target.value)}
            className={mp.input}
            required
          />
        </div>
        {guestError ? <p className="text-sm text-rose-400">{guestError}</p> : null}
        <button type="submit" className={`${mp.creamBtn} w-full`}>
          비회원으로 주문하기
        </button>
      </form>

      <p className={`mt-6 text-center text-xs ${mp.muted}`}>
        계정이 없으신가요?{" "}
        <Link href={`/signup?next=${encodeURIComponent(autopayUrl)}`} className={`${mp.accent} underline`}>
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
      <CommerceAtmosphere className="flex min-h-[70vh] items-center justify-center px-4 py-16">
        <Suspense fallback={<p className={`text-sm ${mp.muted}`}>불러오는 중...</p>}>
          <CheckoutAuthInner />
        </Suspense>
      </CommerceAtmosphere>
      <Footer />
    </>
  );
}
