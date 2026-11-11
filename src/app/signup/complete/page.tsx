"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import {
  AuthCard,
  AuthDarkShell,
  authPrimaryBtnClass,
  authSecondaryBtnClass,
} from "@/components/auth/AuthDarkShell";

function CompleteInner() {
  const params = useSearchParams();
  const email = params.get("email");

  return (
    <AuthDarkShell>
      <AuthCard className="text-center">
        <span className="inline-block rounded-full bg-[#FEE500]/15 px-3 py-1 text-[10px] font-medium tracking-wide text-[#FEE500]">
          WELCOME TO KOREAHARLEM
        </span>
        <h1 className="mt-4 text-2xl font-bold tracking-tight">가입이 완료됐어요</h1>
        <p className="mt-3 text-sm leading-relaxed text-neutral-400">
          이제 주문 내역 · 음원 구매 · THINK 글쓰기를 쓸 수 있어요.
        </p>

        <div className="mt-8 space-y-0 border border-[#333] bg-[#0c0c0c] text-left text-sm">
          <Link
            href="/sale"
            className="flex items-center justify-between border-b border-[#333] px-4 py-3.5 transition-colors hover:bg-[#151515]"
          >
            <span>
              <span className="font-semibold text-white">STORE</span>
              <span className="ml-2 text-neutral-400">굿즈 · CD · 티켓 둘러보기</span>
            </span>
            <span className="text-[#FEE500]">→</span>
          </Link>
          <Link
            href="/music"
            className="flex items-center justify-between border-b border-[#333] px-4 py-3.5 transition-colors hover:bg-[#151515]"
          >
            <span>
              <span className="font-semibold text-white">MUSIC</span>
              <span className="ml-2 text-neutral-400">아티스트 앨범 무료로 듣기</span>
            </span>
            <span className="text-[#FEE500]">→</span>
          </Link>
          <Link
            href="/think"
            className="flex items-center justify-between px-4 py-3.5 transition-colors hover:bg-[#151515]"
          >
            <span>
              <span className="font-semibold text-white">THINK</span>
              <span className="ml-2 text-neutral-400">첫 글 남기기</span>
            </span>
            <span className="text-[#FEE500]">→</span>
          </Link>
        </div>

        <div className="mt-4 border border-[#333] bg-[#0c0c0c] px-4 py-3 text-left text-xs leading-relaxed text-[#FEE500]">
          {email
            ? `${email} 로 인증 메일을 보냈어요. 메일의 링크를 누르면 가입이 최종 확인됩니다.`
            : "이메일로 가입한 경우 인증 메일을 확인해 주세요. 메일의 링크를 누르면 가입이 최종 확인됩니다."}
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Link href="/" className={`${authPrimaryBtnClass} text-center`}>
            홈으로
          </Link>
          <Link href="/mypage" className={`${authSecondaryBtnClass} text-center`}>
            마이페이지
          </Link>
        </div>
      </AuthCard>
    </AuthDarkShell>
  );
}

export default function SignupCompletePage() {
  return (
    <Suspense
      fallback={
        <AuthDarkShell>
          <AuthCard>
            <p className="text-center text-sm text-neutral-500">불러오는 중...</p>
          </AuthCard>
        </AuthDarkShell>
      }
    >
      <CompleteInner />
    </Suspense>
  );
}
