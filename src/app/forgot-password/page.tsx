"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { requestPasswordReset } from "@/lib/auth/passwordReset";
import { AuthPageShell } from "@/components/auth/AuthPageShell";
import { OAuthLoginHint } from "@/components/auth/OAuthLoginHint";

export default function ForgotPasswordPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: resetError } = await requestPasswordReset(supabase, email);
    setLoading(false);

    if (resetError) {
      setError(resetError.message);
      return;
    }

    setSent(true);
  };

  return (
    <AuthPageShell
      eyebrow="Account"
      title="비밀번호 찾기"
      description="가입 시 사용한 이메일로 비밀번호 재설정 링크를 보내드립니다."
    >
      {sent ? (
        <div className="border border-border p-6 text-center">
          <p className="text-sm">메일을 확인해 주세요.</p>
          <p className="mt-2 text-xs leading-relaxed text-muted">
            {email} 주소로 재설정 안내를 발송했습니다.
            <br />
            메일이 보이지 않으면 스팸함을 확인해 주세요.
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
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="email"
              placeholder="가입 이메일"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-border bg-transparent px-4 py-4 text-base outline-none placeholder:text-muted focus:border-foreground md:py-3 md:text-sm"
            />
            {error && <p className="text-xs text-rose-500">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-foreground py-4 text-sm uppercase tracking-widest text-background transition-opacity disabled:opacity-50 md:py-3 md:text-xs"
            >
              {loading ? "발송 중..." : "재설정 메일 보내기"}
            </button>
          </form>
          <OAuthLoginHint />
          <p className="mt-6 text-center text-xs text-muted">
            <Link href="/login" className="text-foreground underline">
              로그인
            </Link>
            {" · "}
            <Link href="/find-id" className="text-foreground underline">
              아이디 찾기
            </Link>
          </p>
        </>
      )}
    </AuthPageShell>
  );
}
