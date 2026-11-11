"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getAuthErrorMessage, signInWithGoogle, signInWithKakao } from "@/lib/auth/oauth";
import { TermsModal } from "@/components/ui/TermsModal";
import { PrivacyModal } from "@/components/ui/PrivacyModal";
import { MarketingConsentModal } from "@/components/auth/MarketingConsentModal";
import {
  AuthCard,
  AuthDarkShell,
  authInputClass,
  authPrimaryBtnClass,
  authSecondaryBtnClass,
} from "@/components/auth/AuthDarkShell";
import { GoogleMark, KakaoMark } from "@/components/auth/OAuthIcons";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<"google" | "kakao" | null>(null);
  const [error, setError] = useState("");

  const [allChecked, setAllChecked] = useState(false);
  const [ageOk, setAgeOk] = useState(false);
  const [termsOk, setTermsOk] = useState(false);
  const [privacyOk, setPrivacyOk] = useState(false);
  const [marketingOk, setMarketingOk] = useState(false);

  const [termsOpen, setTermsOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [marketingOpen, setMarketingOpen] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) router.replace("/");
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const syncAll = (age: boolean, terms: boolean, privacy: boolean, marketing: boolean) => {
    setAllChecked(age && terms && privacy && marketing);
  };

  const handleAll = (checked: boolean) => {
    setAllChecked(checked);
    setAgeOk(checked);
    setTermsOk(checked);
    setPrivacyOk(checked);
    setMarketingOk(checked);
  };

  const requiredOk = ageOk && termsOk && privacyOk;

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!requiredOk) {
      setError("필수 약관에 동의해 주세요.");
      return;
    }
    if (password !== passwordConfirm) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }
    if (password.length < 8) {
      setError("비밀번호는 8자 이상이어야 합니다.");
      return;
    }

    setLoading(true);
    const { data, error: signError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          marketing_consent: marketingOk,
          agreed_terms_at: new Date().toISOString(),
        },
      },
    });
    setLoading(false);

    if (signError) {
      setError(signError.message);
      return;
    }

    // profiles 컬럼은 SQL 적용 후 반영. 실패해도 가입 완료로 이동 (메타데이터에는 이미 저장됨).
    if (data.user && marketingOk) {
      void supabase
        .from("profiles")
        .update({
          marketing_consent: true,
          marketing_consent_at: new Date().toISOString(),
        })
        .eq("id", data.user.id);
    }

    router.push(`/signup/complete?email=${encodeURIComponent(email)}`);
  };

  const handleGoogle = async () => {
    if (!requiredOk) {
      setError("필수 약관에 동의한 뒤 소셜 가입을 진행해 주세요.");
      return;
    }
    setError("");
    setOauthLoading("google");
    const { error: authError } = await signInWithGoogle(supabase);
    if (authError) {
      setError(getAuthErrorMessage(authError.message));
      setOauthLoading(null);
    }
  };

  const handleKakao = async () => {
    if (!requiredOk) {
      setError("필수 약관에 동의한 뒤 소셜 가입을 진행해 주세요.");
      return;
    }
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
      <AuthDarkShell>
        <AuthCard>
          <p className="text-[11px] font-medium tracking-wide text-[#FEE500]">
            WELCOME TO KOREAHARLEM SPACE
          </p>
          <h1 className="mt-2 text-xl font-bold tracking-tight">회원가입</h1>

          <div className="mt-6 space-y-3">
            <button
              type="button"
              onClick={handleKakao}
              disabled={!!oauthLoading}
              className={`${authPrimaryBtnClass} inline-flex items-center justify-center gap-2`}
            >
              <KakaoMark />
              {oauthLoading === "kakao" ? "연결 중..." : "카카오 계정으로 가입하기"}
            </button>
            <button
              type="button"
              onClick={handleGoogle}
              disabled={!!oauthLoading}
              className={`${authSecondaryBtnClass} inline-flex items-center justify-center gap-2`}
            >
              <GoogleMark />
              {oauthLoading === "google" ? "연결 중..." : "Google 계정으로 가입하기"}
            </button>
          </div>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-[#2a2a2a]" />
            <span className="text-[11px] text-neutral-500">또는 이메일로 가입</span>
            <div className="h-px flex-1 bg-[#2a2a2a]" />
          </div>

          <form onSubmit={handleSignup} className="space-y-3">
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
              <div className="mb-1.5 flex items-center justify-between text-xs text-neutral-400">
                <label>비밀번호</label>
                <span className="text-neutral-600">(8자 이상)</span>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="8자 이상의 비밀번호를 입력해주세요"
                className={authInputClass}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-neutral-400">비밀번호 확인</label>
              <input
                type="password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                required
                placeholder="비밀번호를 한번 더 입력해주세요"
                className={authInputClass}
              />
            </div>

            <div className="mt-2 space-y-2.5 border-t border-[#2a2a2a] pt-4 text-sm text-neutral-300">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={allChecked}
                  onChange={(e) => handleAll(e.target.checked)}
                  className="accent-[#FEE500]"
                />
                <span className="font-medium text-white">약관 전체 동의</span>
              </label>

              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={ageOk}
                  onChange={(e) => {
                    const v = e.target.checked;
                    setAgeOk(v);
                    syncAll(v, termsOk, privacyOk, marketingOk);
                  }}
                  className="accent-[#FEE500]"
                />
                <span>
                  만 14세 이상입니다 <span className="text-rose-400">(필수)</span>
                </span>
              </label>

              <div className="flex items-center gap-2">
                <label className="flex flex-1 cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={termsOk}
                    onChange={(e) => {
                      const v = e.target.checked;
                      setTermsOk(v);
                      syncAll(ageOk, v, privacyOk, marketingOk);
                    }}
                    className="accent-[#FEE500]"
                  />
                  <span>
                    이용약관 동의 <span className="text-rose-400">(필수)</span>
                  </span>
                </label>
                <button
                  type="button"
                  onClick={() => setTermsOpen(true)}
                  className="shrink-0 text-xs text-neutral-400 underline hover:text-white"
                >
                  보기
                </button>
              </div>

              <div className="flex items-center gap-2">
                <label className="flex flex-1 cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={privacyOk}
                    onChange={(e) => {
                      const v = e.target.checked;
                      setPrivacyOk(v);
                      syncAll(ageOk, termsOk, v, marketingOk);
                    }}
                    className="accent-[#FEE500]"
                  />
                  <span>
                    개인정보 수집·이용 동의 <span className="text-rose-400">(필수)</span>
                  </span>
                </label>
                <button
                  type="button"
                  onClick={() => setPrivacyOpen(true)}
                  className="shrink-0 text-xs text-neutral-400 underline hover:text-white"
                >
                  보기
                </button>
              </div>

              <div className="flex items-center gap-2">
                <label className="flex flex-1 cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={marketingOk}
                    onChange={(e) => {
                      const v = e.target.checked;
                      setMarketingOk(v);
                      syncAll(ageOk, termsOk, privacyOk, v);
                    }}
                    className="accent-[#FEE500]"
                  />
                  <span>
                    마케팅 정보 수신 동의 (이벤트·파티 소식){" "}
                    <span className="text-neutral-500">(선택)</span>
                  </span>
                </label>
                <button
                  type="button"
                  onClick={() => setMarketingOpen(true)}
                  className="shrink-0 text-xs text-neutral-400 underline hover:text-white"
                >
                  보기
                </button>
              </div>
            </div>

            {error && <p className="text-xs text-rose-400">{error}</p>}

            <button type="submit" disabled={loading} className={authPrimaryBtnClass}>
              {loading ? "처리 중..." : "가입하기"}
            </button>
          </form>

          <p className="mt-5 text-center text-xs text-neutral-400">
            이미 계정이 있으신가요?{" "}
            <Link href="/login" className="font-medium text-[#FEE500] hover:underline">
              로그인하기
            </Link>
          </p>
        </AuthCard>
      </AuthDarkShell>

      {termsOpen && <TermsModal onClose={() => setTermsOpen(false)} />}
      {privacyOpen && <PrivacyModal onClose={() => setPrivacyOpen(false)} />}
      {marketingOpen && <MarketingConsentModal onClose={() => setMarketingOpen(false)} />}
    </>
  );
}
