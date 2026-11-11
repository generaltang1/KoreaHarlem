"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getAuthErrorMessage, signInWithGoogle, signInWithKakao } from "@/lib/auth/oauth";
import { useLoginModal } from "@/context/LoginModalContext";
import { TermsModal } from "@/components/ui/TermsModal";
import { PrivacyModal } from "@/components/ui/PrivacyModal";
import { GoogleMark, KakaoMark } from "@/components/auth/OAuthIcons";

export function LoginModal() {
  const { isOpen, closeLoginModal } = useLoginModal();
  const router = useRouter();
  const supabase = createClient();

  const [emailMode, setEmailMode] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<"google" | "kakao" | null>(null);
  const [error, setError] = useState("");
  const [termsOpen, setTermsOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setEmailMode(false);
      setEmail("");
      setPassword("");
      setError("");
      setOauthLoading(null);
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLoginModal();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, closeLoginModal]);

  if (!isOpen) return null;

  const go = (href: string) => {
    closeLoginModal();
    router.push(href);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (authError) {
      setError("이메일 또는 비밀번호가 올바르지 않습니다.");
      return;
    }
    closeLoginModal();
    router.refresh();
  };

  const handleGoogle = async () => {
    setError("");
    setOauthLoading("google");
    const { error: authError } = await signInWithGoogle(supabase);
    if (authError) {
      setError(getAuthErrorMessage(authError.message));
      setOauthLoading(null);
    }
  };

  const handleKakao = async () => {
    setError("");
    setOauthLoading("kakao");
    const { error: authError } = await signInWithKakao(supabase);
    if (authError) {
      setError(getAuthErrorMessage(authError.message));
      setOauthLoading(null);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 px-4 backdrop-blur-[2px]"
        onClick={closeLoginModal}
        role="presentation"
      >
        <div
          className="relative w-full max-w-[420px] border border-[#2a2a2a] bg-[#141414] p-8 text-neutral-100 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="login-modal-title"
        >
          <div className="mb-6 flex items-center justify-between">
            <p className="text-base font-semibold tracking-tight">koreaharlem</p>
            <button
              type="button"
              onClick={closeLoginModal}
              className="flex h-8 w-8 items-center justify-center text-neutral-400 transition-colors hover:text-white"
              aria-label="닫기"
            >
              ✕
            </button>
          </div>

          <h2 id="login-modal-title" className="text-xl font-bold tracking-tight">
            3초 만에 시작하기
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-neutral-400">
            로그인하고 주문 조회와 마이페이지를 바로 이용하세요. 처음이면 그대로 가입돼요.
          </p>

          <div className="mt-6 space-y-3">
            <button
              type="button"
              onClick={handleKakao}
              disabled={!!oauthLoading}
              className="flex w-full items-center justify-center gap-2 bg-[#FEE500] py-3.5 text-sm font-medium text-[#191919] transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              <KakaoMark />
              {oauthLoading === "kakao" ? "연결 중..." : "카카오톡으로 3초 만에 시작하기"}
            </button>
            <button
              type="button"
              onClick={handleGoogle}
              disabled={!!oauthLoading}
              className="flex w-full items-center justify-center gap-2 border border-[#333] bg-[#1c1c1c] py-3.5 text-sm text-white transition-colors hover:border-neutral-500 disabled:opacity-50"
            >
              <GoogleMark />
              {oauthLoading === "google" ? "연결 중..." : "Google 계정으로 계속하기"}
            </button>
          </div>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-[#2a2a2a]" />
            <span className="text-[11px] text-neutral-500">또는</span>
            <div className="h-px flex-1 bg-[#2a2a2a]" />
          </div>

          {!emailMode ? (
            <button
              type="button"
              onClick={() => setEmailMode(true)}
              className="w-full border border-[#333] bg-[#1c1c1c] py-3.5 text-sm text-white transition-colors hover:border-neutral-500"
            >
              이메일로 로그인
            </button>
          ) : (
            <form onSubmit={handleLogin} className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="name@domain.com"
                className="w-full border border-[#333] bg-[#0c0c0c] px-3 py-3 text-sm outline-none placeholder:text-neutral-600 focus:border-white"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="비밀번호를 입력해주세요"
                className="w-full border border-[#333] bg-[#0c0c0c] px-3 py-3 text-sm outline-none placeholder:text-neutral-600 focus:border-white"
              />
              {error && <p className="text-xs text-rose-400">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#FEE500] py-3.5 text-sm font-semibold text-[#191919] disabled:opacity-50"
              >
                {loading ? "처리 중..." : "로그인하기"}
              </button>
            </form>
          )}

          {error && !emailMode && <p className="mt-3 text-xs text-rose-400">{error}</p>}

          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[12px] text-neutral-500">
            <button
              type="button"
              onClick={() => go("/signup")}
              className="font-medium text-[#FEE500] hover:underline"
            >
              회원가입
            </button>
            <span>·</span>
            <button
              type="button"
              onClick={() => go("/forgot-password")}
              className="hover:text-white"
            >
              아이디 · 비밀번호 찾기
            </button>
            <span>·</span>
            <button
              type="button"
              onClick={() => go("/order-inquiry")}
              className="hover:text-white"
            >
              비회원 주문 조회
            </button>
          </div>

          <p className="mt-4 text-center text-[11px] leading-relaxed text-neutral-500">
            시작하면{" "}
            <button type="button" onClick={() => setTermsOpen(true)} className="underline hover:text-neutral-300">
              이용약관
            </button>
            과{" "}
            <button type="button" onClick={() => setPrivacyOpen(true)} className="underline hover:text-neutral-300">
              개인정보처리방침
            </button>
            에 동의하게 돼요. 만 14세 이상만 가입할 수 있어요.
          </p>

          <p className="mt-3 text-center text-[11px] text-neutral-600">
            <Link href="/login" onClick={closeLoginModal} className="hover:text-neutral-400">
              전체 로그인 페이지 →
            </Link>
          </p>
        </div>
      </div>

      {termsOpen && <TermsModal onClose={() => setTermsOpen(false)} />}
      {privacyOpen && <PrivacyModal onClose={() => setPrivacyOpen(false)} />}
    </>
  );
}
