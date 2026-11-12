"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  AuthCard,
  AuthDarkShell,
  authInputClass,
  authPrimaryBtnClass,
} from "@/components/auth/AuthDarkShell";

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

  const checks = useMemo(
    () => ({
      len: password.length >= 8,
      letter: /[a-zA-Z]/.test(password),
      number: /\d/.test(password),
    }),
    [password],
  );

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

    if (!checks.len || !checks.letter || !checks.number) {
      setError("비밀번호는 8자 이상, 영문·숫자를 포함해야 합니다.");
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
    <AuthDarkShell>
      <AuthCard>
        <span className="inline-block rounded-full bg-[#FEE500]/15 px-2.5 py-1 text-[10px] font-medium text-[#FEE500]">
          회원
        </span>
        <h1 className="mt-3 text-xl font-bold tracking-tight">새 비밀번호 설정</h1>
        <p className="mt-2 text-sm leading-relaxed text-[#a8a49b]">
          메일 링크로 들어오셨어요. 앞으로 사용할 새 비밀번호를 입력해주세요.
        </p>

        {!ready ? (
          <p className="mt-6 text-center text-sm text-[#6e6b65]">확인 중...</p>
        ) : done ? (
          <div className="mt-6 rounded-[12px] border border-[rgba(244,241,234,0.12)] bg-[rgba(244,241,234,0.05)] p-5 text-center">
            <p className="text-sm">비밀번호가 변경되었습니다.</p>
            <p className="mt-2 text-xs text-[#a8a49b]">잠시 후 로그인 화면으로 이동합니다.</p>
          </div>
        ) : hasSession ? (
          <form onSubmit={handleSubmit} className="mt-6 space-y-3">
            <div>
              <label className="mb-1.5 block text-[11px] font-medium tracking-wide text-[#a8a49b]">새 비밀번호</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="8자 이상, 영문·숫자 조합"
                className={authInputClass}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-medium tracking-wide text-[#a8a49b]">새 비밀번호 확인</label>
              <input
                type="password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                required
                placeholder="한 번 더 입력해주세요"
                className={authInputClass}
              />
            </div>

            <ul className="space-y-1 pt-1 text-xs">
              {(
                [
                  ["len", "8자 이상", checks.len],
                  ["letter", "영문 포함", checks.letter],
                  ["number", "숫자 포함", checks.number],
                ] as const
              ).map(([key, label, ok]) => (
                <li
                  key={key}
                  className={ok ? "text-[#FEE500]" : "text-[#6e6b65]"}
                >
                  {ok ? "✓" : "○"} {label}
                </li>
              ))}
            </ul>

            {error && <p className="text-xs text-rose-400">{error}</p>}
            <button type="submit" disabled={loading} className={authPrimaryBtnClass}>
              {loading ? "저장 중..." : "비밀번호 변경하기"}
            </button>
          </form>
        ) : (
          <div className="mt-6 rounded-[12px] border border-[rgba(244,241,234,0.12)] bg-[rgba(244,241,234,0.05)] p-5 text-center">
            {error && <p className="text-xs text-rose-400">{error}</p>}
            <Link
              href="/forgot-password"
              className="mt-4 inline-block text-xs text-[#FEE500] underline"
            >
              비밀번호 찾기 다시하기
            </Link>
          </div>
        )}

        <p className="mt-6 text-center text-xs text-[#6e6b65]">
          링크가 만료됐나요?{" "}
          <Link href="/forgot-password" className="text-[#FEE500] hover:underline">
            재설정 메일 다시 받기
          </Link>
        </p>
      </AuthCard>
    </AuthDarkShell>
  );
}
