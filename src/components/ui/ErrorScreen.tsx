"use client";

import Link from "next/link";
import { site } from "@/lib/siteTheme";

type ErrorScreenProps = {
  variant: "404" | "500";
  errorCode?: string;
  onRetry?: () => void;
};

export function ErrorScreen({ variant, errorCode, onRetry }: ErrorScreenProps) {
  const is404 = variant === "404";

  return (
    <div className="relative flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center overflow-hidden bg-[#0a0a0a] px-4 py-20 text-center text-[#F4F1EA]">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_20%,rgba(30,41,59,0.45),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_15%_70%,rgba(20,25,35,0.55),transparent_45%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_85%_60%,rgba(25,20,35,0.5),transparent_45%)]" />
        <div className="absolute left-[-5%] top-[18%] h-[42%] w-[110%] rounded-full bg-[radial-gradient(ellipse,rgba(255,80,120,0.12),transparent_70%)] blur-2xl" />
        <div className="absolute left-[10%] top-[22%] h-[30%] w-[80%] rounded-full bg-[radial-gradient(ellipse,rgba(100,140,255,0.1),transparent_70%)] blur-xl" />
        <div className="absolute left-[8%] top-[38%] h-px w-[40%] bg-gradient-to-r from-transparent via-teal-200/40 to-transparent" />
        <div className="absolute right-[5%] top-[36%] h-1 w-[35%] bg-gradient-to-r from-blue-400/30 via-white/40 to-transparent blur-[1px]" />
        <div className="absolute bottom-0 right-0 h-[45%] w-[55%] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(220,40,60,0.18),transparent_65%)] blur-2xl" />
        <div className="absolute bottom-0 left-[20%] h-[40%] w-[50%] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(40,80,220,0.16),transparent_65%)] blur-2xl" />
      </div>

      <div className="relative z-10 flex max-w-xl flex-col items-center gap-5">
        {is404 ? (
          <p className="text-[100px] font-black leading-none tracking-tight sm:text-[140px]">404</p>
        ) : (
          <div
            className="flex h-28 w-16 items-end justify-center rounded-sm bg-gradient-to-b from-red-500 to-red-700 pb-3 text-5xl font-black text-white shadow-[0_0_40px_rgba(220,38,38,0.45)] sm:h-36 sm:w-20 sm:text-6xl"
            aria-hidden
          >
            !
          </div>
        )}

        <h1 className="text-2xl font-bold">
          {is404 ? "페이지를 찾을 수 없어요" : "잠시 문제가 생겼어요"}
        </h1>
        <p className="text-sm text-[#A8A49B]">
          {is404
            ? "주소가 바뀌었거나 아직 준비 중인 페이지예요."
            : "잠깐 후 다시 시도해주세요. 계속되면 고객센터로 알려주세요."}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
          {is404 ? (
            <>
              <Link
                href="/"
                className={`${site.creamBtn} h-12 !py-0 font-bold`}
              >
                홈으로
              </Link>
              <Link
                href="/sale"
                className={`${site.ghostBtn} h-12 !py-0 font-medium`}
              >
                스토어 보기
              </Link>
            </>
          ) : (
            <>
              {onRetry ? (
                <button
                  type="button"
                  onClick={onRetry}
                  className={`${site.creamBtn} h-12 !py-0 font-bold`}
                >
                  다시 시도
                </button>
              ) : null}
              <Link
                href="/"
                className={`${site.ghostBtn} h-12 !py-0 font-medium`}
              >
                홈으로
              </Link>
            </>
          )}
        </div>

        <p className="pt-1 font-mono text-[10px] text-[#6E6B65]">
          {is404 ? "페이지 없음" : `ERROR CODE ${errorCode ? `[${errorCode}]` : "[서버 오류]"}`}
        </p>
      </div>
    </div>
  );
}
