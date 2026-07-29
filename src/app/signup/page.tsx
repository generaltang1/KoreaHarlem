"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ConsentModal } from "@/components/auth/ConsentModal";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export default function SignupPage() {
  const router = useRouter();
  const [showConsent, setShowConsent] = useState(true);
  const [consentDone, setConsentDone] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) router.replace("/");
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleConsentConfirm = () => {
    setShowConsent(false);
    setConsentDone(true);
  };

  const handleConsentCancel = () => {
    router.push("/");
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== passwordConfirm) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }
    if (password.length < 8) {
      setError("비밀번호는 8자 이상이어야 합니다.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
    }
  };

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  const handleKakao = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "kakao",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: "profile_nickname profile_image",
      },
    });
  };

  return (
    <>
      <Header />
      <main className="flex min-h-[80vh] items-center justify-center px-4 py-10 md:py-16">
        {showConsent && !consentDone && (
          <ConsentModal
            onConfirm={handleConsentConfirm}
            onCancel={handleConsentCancel}
          />
        )}

        {consentDone && (
          <div className="w-full max-w-sm">
            <div className="mb-8 text-center">
              <p className="text-[10px] uppercase tracking-widest text-muted">Join</p>
              <h1 className="mt-1 text-xl font-medium uppercase tracking-wider">
                회원가입
              </h1>
            </div>

            {success ? (
              <div className="border border-border p-6 text-center">
                <p className="text-sm">이메일을 확인해 주세요.</p>
                <p className="mt-2 text-xs text-muted">
                  {email}로 인증 메일을 발송했습니다.
                  <br />
                  메일의 링크를 클릭하면 가입이 완료됩니다.
                </p>
                <Link
                  href="/login"
                  className="mt-6 inline-block text-xs uppercase tracking-widest underline"
                >
                  로그인으로 이동
                </Link>
              </div>
            ) : (
              <>
                {/* 소셜 로그인 */}
                <div className="space-y-3">
                  <button
                    onClick={handleGoogle}
                    className="flex w-full items-center justify-center gap-3 border border-border py-4 text-sm transition-colors hover:bg-neutral-50 md:py-3 md:text-xs"
                  >
                    <svg width="18" height="18" viewBox="0 0 18 18">
                      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
                      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"/>
                      <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
                      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
                    </svg>
                    Google로 가입
                  </button>
                  <button
                    onClick={handleKakao}
                    className="flex w-full items-center justify-center gap-3 border border-[#FEE500] bg-[#FEE500] py-4 text-sm transition-opacity hover:opacity-90 md:py-3 md:text-xs"
                  >
                    <svg width="18" height="18" viewBox="0 0 18 18">
                      <path fill="#3C1E1E" d="M9 1.5C4.858 1.5 1.5 4.134 1.5 7.38c0 2.07 1.299 3.888 3.267 4.953l-.833 3.104 3.618-2.382A9.3 9.3 0 009 13.26c4.142 0 7.5-2.634 7.5-5.88S13.142 1.5 9 1.5z"/>
                    </svg>
                    Kakao로 가입
                  </button>
                </div>

                <div className="my-6 flex items-center gap-3">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-[10px] uppercase tracking-widest text-muted">또는</span>
                  <div className="h-px flex-1 bg-border" />
                </div>

                {/* 이메일 가입 폼 */}
                <form onSubmit={handleSignup} className="space-y-3">
                  <input
                    type="email"
                    placeholder="이메일"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full border border-border bg-transparent px-4 py-4 text-base outline-none placeholder:text-muted focus:border-foreground md:py-3 md:text-sm"
                  />
                  <input
                    type="password"
                    placeholder="비밀번호 (8자 이상)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full border border-border bg-transparent px-4 py-4 text-base outline-none placeholder:text-muted focus:border-foreground md:py-3 md:text-sm"
                  />
                  <input
                    type="password"
                    placeholder="비밀번호 확인"
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    required
                    className="w-full border border-border bg-transparent px-4 py-4 text-base outline-none placeholder:text-muted focus:border-foreground md:py-3 md:text-sm"
                  />

                  {error && (
                    <p className="text-xs text-rose-500">{error}</p>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-foreground py-4 text-sm uppercase tracking-widest text-background transition-opacity disabled:opacity-50 md:py-3 md:text-xs"
                  >
                    {loading ? "처리 중..." : "가입하기"}
                  </button>
                </form>

                <p className="mt-6 text-center text-xs text-muted">
                  이미 계정이 있으신가요?{" "}
                  <Link href="/login" className="text-foreground underline">
                    로그인
                  </Link>
                </p>
              </>
            )}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
