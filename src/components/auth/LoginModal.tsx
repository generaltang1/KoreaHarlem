"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getAuthErrorMessage, signInWithGoogle, signInWithKakao } from "@/lib/auth/oauth";
import { enforceNotBlocked } from "@/lib/auth/enforceNotBlocked";
import { useLoginModal } from "@/context/LoginModalContext";
import { TermsModal } from "@/components/ui/TermsModal";
import { PrivacyModal } from "@/components/ui/PrivacyModal";
import { GoogleMark, KakaoMark } from "@/components/auth/OAuthIcons";
import { site } from "@/lib/siteTheme";

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
    if (authError) {
      setLoading(false);
      setError("이메일 또는 비밀번호가 올바르지 않습니다.");
      return;
    }
    const { blocked } = await enforceNotBlocked(supabase);
    setLoading(false);
    if (blocked) {
      setError("이용이 제한된 계정입니다. 고객센터로 문의해 주세요.");
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
        className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 px-4 backdrop-blur-[4px]"
        onClick={closeLoginModal}
        role="presentation"
      >
        <div
          className={`relative w-full max-w-[420px] p-8 ${site.glassModal} ${site.font} text-[#f4f1ea]`}
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
              className="flex h-8 w-8 items-center justify-center rounded-[8px] text-[#a8a49b] transition-colors hover:bg-[rgba(244,241,234,0.06)] hover:text-[#f4f1ea]"
              aria-label="닫기"
            >
              ✕
            </button>
          </div>

          <h2 id="login-modal-title" className="text-xl font-bold tracking-tight">
            3초 만에 시작하기
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[#a8a49b]">
            로그인하고 주문 조회와 마이페이지를 바로 이용하세요. 처음이면 그대로 가입돼요.
          </p>

          <div className="mt-6 space-y-3">
            <button
              type="button"
              onClick={handleKakao}
              disabled={!!oauthLoading}
              className={`${site.yellowBtn} w-full gap-2`}
            >
              <KakaoMark />
              {oauthLoading === "kakao" ? "연결 중..." : "카카오톡으로 3초 만에 시작하기"}
            </button>
            <button
              type="button"
              onClick={handleGoogle}
              disabled={!!oauthLoading}
              className={`${site.ghostBtn} w-full gap-2`}
            >
              <GoogleMark />
              {oauthLoading === "google" ? "연결 중..." : "Google 계정으로 계속하기"}
            </button>
          </div>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-[rgba(244,241,234,0.12)]" />
            <span className="text-[11px] text-[#6e6b65]">또는</span>
            <div className="h-px flex-1 bg-[rgba(244,241,234,0.12)]" />
          </div>

          {!emailMode ? (
            <button
              type="button"
              onClick={() => setEmailMode(true)}
              className={`${site.ghostBtn} w-full`}
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
                className={site.input}
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="비밀번호를 입력해주세요"
                className={site.input}
              />
              {error && <p className="text-xs text-rose-400">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className={`${site.yellowBtn} w-full`}
              >
                {loading ? "처리 중..." : "로그인하기"}
              </button>
            </form>
          )}

          {error && !emailMode && <p className="mt-3 text-xs text-rose-400">{error}</p>}

          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[12px] text-[#a8a49b]">
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
              className="hover:text-[#f4f1ea]"
            >
              아이디 · 비밀번호 찾기
            </button>
            <span>·</span>
            <button
              type="button"
              onClick={() => go("/order-inquiry")}
              className="hover:text-[#f4f1ea]"
            >
              비회원 주문 조회
            </button>
          </div>

          <p className="mt-4 text-center text-[11px] leading-relaxed text-[#6e6b65]">
            시작하면{" "}
            <button type="button" onClick={() => setTermsOpen(true)} className="underline hover:text-[#f4f1ea]">
              이용약관
            </button>
            과{" "}
            <button type="button" onClick={() => setPrivacyOpen(true)} className="underline hover:text-[#f4f1ea]">
              개인정보처리방침
            </button>
            에 동의하게 돼요. 만 14세 이상만 가입할 수 있어요.
          </p>

          <p className="mt-3 text-center text-[11px] text-[#6e6b65]">
            <Link href="/login" onClick={closeLoginModal} className="hover:text-[#a8a49b]">
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
