"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { requestPasswordReset } from "@/lib/auth/passwordReset";
import {
  AuthCard,
  AuthDarkShell,
  authInputClass,
  authPrimaryBtnClass,
} from "@/components/auth/AuthDarkShell";

type Tab = "id" | "password";

const PROVIDER_LABEL: Record<string, string> = {
  email: "이메일",
  kakao: "카카오",
  google: "Google",
  unknown: "소셜/이메일",
};

export function FindAccountClient({ initialTab }: { initialTab: Tab }) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [result, setResult] = useState<{
    found: boolean;
    maskedEmail?: string;
    provider?: string;
    createdAt?: string | null;
    message?: string;
  } | null>(null);

  const supabase = createClient();

  const switchTab = (next: Tab) => {
    setTab(next);
    setError("");
    setSent(false);
    setResult(null);
  };

  const handleFindId = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setResult(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/find-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "조회에 실패했습니다.");
        return;
      }
      setResult(data);
    } catch {
      setError("조회 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSent(false);
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
    <AuthDarkShell>
      <AuthCard>
        <h1 className="text-xl font-bold tracking-tight">계정 정보 찾기</h1>

        <div className="mt-5 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => switchTab("id")}
            className={`border px-3 py-2.5 text-left text-xs transition-colors ${
              tab === "id"
                ? "border-white/40 bg-[#1c1c1c] text-white"
                : "border-[#2a2a2a] text-neutral-500 hover:text-neutral-300"
            }`}
          >
            <span className="font-mono text-[10px] text-neutral-500">[01]</span>{" "}
            아이디 찾기
          </button>
          <button
            type="button"
            onClick={() => switchTab("password")}
            className={`border px-3 py-2.5 text-left text-xs transition-colors ${
              tab === "password"
                ? "border-white/40 bg-[#1c1c1c] text-white"
                : "border-[#2a2a2a] text-neutral-500 hover:text-neutral-300"
            }`}
          >
            <span className="font-mono text-[10px] text-neutral-500">[02]</span>{" "}
            비밀번호 찾기
          </button>
        </div>

        {tab === "id" ? (
          <>
            <p className="mt-5 text-sm leading-relaxed text-neutral-400">
              가입 시 사용한 이메일을 입력하면 계정 존재 여부와 로그인 방식(이메일 /
              카카오 / Google)을 안내해 드려요.
            </p>
            <form onSubmit={handleFindId} className="mt-5 space-y-3">
              <label className="block text-xs text-neutral-400">가입 이메일</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="name@domain.com"
                className={authInputClass}
              />
              {error && <p className="text-xs text-rose-400">{error}</p>}
              <button type="submit" disabled={loading} className={authPrimaryBtnClass}>
                {loading ? "확인 중..." : "가입 정보 확인하기"}
              </button>
            </form>

            {result && (
              <div className="mt-4 border border-[#333] bg-[#0c0c0c] p-4 text-sm">
                {result.found ? (
                  <>
                    <p className="font-medium text-[#FEE500]">✓ {result.maskedEmail}</p>
                    <p className="mt-2 text-neutral-300">
                      {PROVIDER_LABEL[result.provider ?? "unknown"]}로 가입한 계정이에요
                      {result.createdAt ? ` · ${result.createdAt} 가입` : ""}
                    </p>
                    <p className="mt-2 text-xs text-neutral-500">
                      {result.provider === "kakao"
                        ? "로그인 화면에서 카카오로 시작하기를 눌러주세요."
                        : result.provider === "google"
                          ? "로그인 화면에서 Google로 계속하기를 눌러주세요."
                          : "로그인 화면에서 이메일과 비밀번호로 로그인해 주세요."}
                    </p>
                  </>
                ) : (
                  <p className="text-neutral-400">
                    {result.message || "가입 정보를 찾지 못했어요."}
                  </p>
                )}
              </div>
            )}
          </>
        ) : sent ? (
          <div className="mt-6 border border-[#333] bg-[#0c0c0c] p-5 text-center">
            <p className="text-sm">메일을 확인해 주세요.</p>
            <p className="mt-2 text-xs leading-relaxed text-neutral-400">
              {email} 주소로 재설정 안내를 발송했습니다.
              <br />
              메일이 보이지 않으면 스팸함을 확인해 주세요.
            </p>
          </div>
        ) : (
          <>
            <p className="mt-5 text-sm leading-relaxed text-neutral-400">
              가입 시 사용한 이메일을 입력하면 비밀번호를 다시 설정할 수 있는 보안
              링크를 보내드려요.
            </p>
            <form onSubmit={handleReset} className="mt-5 space-y-3">
              <label className="block text-xs text-neutral-400">가입 이메일</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="name@domain.com"
                className={authInputClass}
              />
              {error && <p className="text-xs text-rose-400">{error}</p>}
              <button type="submit" disabled={loading} className={authPrimaryBtnClass}>
                {loading ? "발송 중..." : "재설정 메일 보내기"}
              </button>
            </form>
            <div className="mt-4 border border-[#333] bg-[#0c0c0c] p-4 text-xs leading-relaxed text-neutral-400">
              <p className="font-medium text-[#FEE500]">Google / Kakao로 가입하셨나요?</p>
              <p className="mt-2">
                소셜 로그인으로 가입한 계정은 별도 비밀번호가 없습니다. 로그인 화면에서
                Google 또는 카카오 버튼을 이용해 주세요.
              </p>
            </div>
          </>
        )}

        <p className="mt-6 text-center text-xs text-neutral-500">
          <Link href="/login" className="hover:text-white">
            로그인
          </Link>
          {" · "}
          <Link href="/signup" className="text-[#FEE500] hover:underline">
            회원가입
          </Link>
        </p>
      </AuthCard>
    </AuthDarkShell>
  );
}
