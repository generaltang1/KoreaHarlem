"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AuthPageShell } from "@/components/auth/AuthPageShell";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [ready, setReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const code = searchParams.get("code");
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError && !cancelled) {
          setError("링크가 만료되었거나 유효하지 않습니다. 비밀번호 찾기를 다시 시도해 주세요.");
          setReady(true);
          return;
        }
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!cancelled) {
        setHasSession(!!session);
        if (!session && !code) {
          setError("재설정 링크로 다시 접속해 주세요. (메일의 링크를 클릭해 주세요)");
        }
        setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [searchParams, supabase.auth]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("비밀번호는 8자 이상이어야 합니다.");
      return;
    }
    if (password !== passwordConfirm) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setDone(true);
    await supabase.auth.signOut();
    setTimeout(() => router.push("/login"), 2000);
  };

  return (
    <AuthPageShell
      eyebrow="Account"
      title="새 비밀번호"
      description="새로 사용할 비밀번호를 입력해 주세요."
    >
      {!ready ? (
        <p className="text-center text-sm text-muted">확인 중...</p>
      ) : done ? (
        <div className="border border-border p-6 text-center">
          <p className="text-sm">비밀번호가 변경되었습니다.</p>
          <p className="mt-2 text-xs text-muted">잠시 후 로그인 화면으로 이동합니다.</p>
        </div>
      ) : hasSession ? (
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="password"
            placeholder="새 비밀번호 (8자 이상)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className="w-full border border-border bg-transparent px-4 py-4 text-base outline-none placeholder:text-muted focus:border-foreground md:py-3 md:text-sm"
          />
          <input
            type="password"
            placeholder="새 비밀번호 확인"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            required
            minLength={8}
            className="w-full border border-border bg-transparent px-4 py-4 text-base outline-none placeholder:text-muted focus:border-foreground md:py-3 md:text-sm"
          />
          {error && <p className="text-xs text-rose-500">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-foreground py-4 text-sm uppercase tracking-widest text-background transition-opacity disabled:opacity-50 md:py-3 md:text-xs"
          >
            {loading ? "저장 중..." : "비밀번호 변경"}
          </button>
        </form>
      ) : (
        <div className="border border-border p-6 text-center">
          {error && <p className="text-xs text-rose-500">{error}</p>}
          <Link
            href="/forgot-password"
            className="mt-4 inline-block text-xs uppercase tracking-widest underline"
          >
            비밀번호 찾기 다시하기
          </Link>
        </div>
      )}
    </AuthPageShell>
  );
}
