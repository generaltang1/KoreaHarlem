"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getAuthErrorMessage, signInWithGoogle, signInWithKakao } from "@/lib/auth/oauth";
import {
  AuthCard,
  AuthDarkShell,
  authInputClass,
  authPrimaryBtnClass,
  authSecondaryBtnClass,
} from "@/components/auth/AuthDarkShell";
import { GoogleMark, KakaoMark } from "@/components/auth/OAuthIcons";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<"google" | "kakao" | null>(null);
  const [error, setError] = useState("");
  const [persist, setPersist] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const next = params.get("next");

    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        router.replace(next && next.startsWith("/") ? next : "/");
      }
    });

    if (params.get("error") === "auth") {
      setError(getAuthErrorMessage(params.get("message")));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (authError) {
      setError("이메일 또는 비밀번호가 올바르지 않습니다.");
    } else {
      if (!persist) {
        // 세션 유지 해제 요청은 클라이언트 persist 플래그로만 기록 (Supabase는 기본 세션 유지)
        try {
          sessionStorage.setItem("kh_session_temp", "1");
        } catch {
          /* ignore */
        }
      }
      const params = new URLSearchParams(window.location.search);
      const next = params.get("next");
      router.push(next && next.startsWith("/") ? next : "/");
      router.refresh();
    }
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
    <AuthDarkShell>
      <AuthCard>
        <h1 className="text-xl font-bold tracking-tight">로그인</h1>

        <div className="mt-6 space-y-3">
          <button
            type="button"
            onClick={handleKakao}
            disabled={!!oauthLoading}
            className={`${authPrimaryBtnClass} inline-flex items-center justify-center gap-2`}
          >
            <KakaoMark />
            {oauthLoading === "kakao" ? "연결 중..." : "카카오로 3초 만에 시작하기"}
          </button>
          <button
            type="button"
            onClick={handleGoogle}
            disabled={!!oauthLoading}
            className={`${authSecondaryBtnClass} inline-flex items-center justify-center gap-2`}
          >
            <GoogleMark />
            {oauthLoading === "google" ? "연결 중..." : "Google 계정으로 계속하기"}
          </button>
        </div>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-[#2a2a2a]" />
          <span className="text-[11px] text-neutral-500">또는 이메일 로그인</span>
          <div className="h-px flex-1 bg-[#2a2a2a]" />
        </div>

        <form onSubmit={handleLogin} className="space-y-3">
          <div>
            <label className="mb-1.5 block text-xs text-neutral-400">이메일 주소</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="name@domain.com"
              className={authInputClass}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-neutral-400">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="비밀번호를 입력해주세요"
              className={authInputClass}
            />
          </div>

          <div className="flex items-center justify-between gap-3 pt-1 text-xs text-neutral-400">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={persist}
                onChange={(e) => setPersist(e.target.checked)}
                className="accent-[#FEE500]"
              />
              로그인 상태 유지
            </label>
            <Link href="/find-id" className="hover:text-white">
              아이디 및 비밀번호 찾기
            </Link>
          </div>

          {error && <p className="text-xs text-rose-400">{error}</p>}

          <button type="submit" disabled={loading} className={authPrimaryBtnClass}>
            {loading ? "처리 중..." : "로그인하기"}
          </button>
        </form>

        <p className="mt-5 text-center text-xs text-neutral-400">
          아직 코할 계정이 없으신가요?{" "}
          <Link href="/signup" className="font-medium text-[#FEE500] hover:underline">
            회원가입하기
          </Link>
        </p>
        <p className="mt-3 text-center text-xs text-neutral-500">
          비회원으로 주문하셨나요?{" "}
          <Link href="/order-inquiry" className="hover:text-white">
            비회원 주문 조회 →
          </Link>
        </p>
      </AuthCard>
    </AuthDarkShell>
  );
}
