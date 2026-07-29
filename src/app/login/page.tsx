"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) router.replace("/");
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      setError("이메일 또는 비밀번호가 올바르지 않습니다.");
    } else {
      router.push("/");
      router.refresh();
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
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <p className="text-[10px] uppercase tracking-widest text-muted">Welcome</p>
            <h1 className="mt-1 text-xl font-medium uppercase tracking-wider">
              로그인
            </h1>
          </div>

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
              Google로 로그인
            </button>
            <button
              onClick={handleKakao}
              className="flex w-full items-center justify-center gap-3 border border-[#FEE500] bg-[#FEE500] py-4 text-sm transition-opacity hover:opacity-90 md:py-3 md:text-xs"
            >
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path fill="#3C1E1E" d="M9 1.5C4.858 1.5 1.5 4.134 1.5 7.38c0 2.07 1.299 3.888 3.267 4.953l-.833 3.104 3.618-2.382A9.3 9.3 0 009 13.26c4.142 0 7.5-2.634 7.5-5.88S13.142 1.5 9 1.5z"/>
              </svg>
              Kakao로 로그인
            </button>
          </div>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-[10px] uppercase tracking-widest text-muted">또는</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {/* 이메일 로그인 */}
          <form onSubmit={handleLogin} className="space-y-3">
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
              placeholder="비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border border-border bg-transparent px-4 py-4 text-base outline-none placeholder:text-muted focus:border-foreground md:py-3 md:text-sm"
            />

            {error && <p className="text-xs text-rose-500">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-foreground py-4 text-sm uppercase tracking-widest text-background transition-opacity disabled:opacity-50 md:py-3 md:text-xs"
            >
              {loading ? "처리 중..." : "로그인"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-muted">
            계정이 없으신가요?{" "}
            <Link href="/signup" className="text-foreground underline">
              회원가입
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
