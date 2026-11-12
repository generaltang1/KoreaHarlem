import type { CSSProperties } from "react";

/** 마이페이지·커머스 F 섹션 — Figma 우주/네뷸라 + 글래스 카드 톤 */

/** AuthDarkShell과 동일 계열 + 별/안개 레이어 */
export const mpAtmosphereStyle: CSSProperties = {
  backgroundImage: [
    // 별
    "radial-gradient(1px 1px at 12% 18%, rgba(255,255,255,0.55), transparent)",
    "radial-gradient(1px 1px at 28% 42%, rgba(255,255,255,0.35), transparent)",
    "radial-gradient(1.5px 1.5px at 48% 12%, rgba(255,255,255,0.45), transparent)",
    "radial-gradient(1px 1px at 72% 28%, rgba(255,255,255,0.4), transparent)",
    "radial-gradient(1px 1px at 88% 58%, rgba(255,255,255,0.3), transparent)",
    "radial-gradient(1px 1px at 18% 72%, rgba(255,255,255,0.35), transparent)",
    "radial-gradient(1.5px 1.5px at 62% 78%, rgba(255,255,255,0.5), transparent)",
    "radial-gradient(1px 1px at 40% 88%, rgba(255,255,255,0.25), transparent)",
    "radial-gradient(1px 1px at 55% 48%, rgba(255,255,255,0.3), transparent)",
    "radial-gradient(1px 1px at 8% 52%, rgba(255,255,255,0.28), transparent)",
    // 네뷸라
    "radial-gradient(ellipse 55% 40% at 75% 15%, rgba(55,75,130,0.4), transparent 70%)",
    "radial-gradient(ellipse 45% 45% at 18% 75%, rgba(70,45,110,0.35), transparent 65%)",
    "radial-gradient(ellipse 40% 30% at 50% 40%, rgba(30,45,70,0.35), transparent 70%)",
    "radial-gradient(ellipse 35% 35% at 90% 80%, rgba(40,55,90,0.3), transparent 60%)",
  ].join(", "),
};

export const mp = {
  page: "relative min-h-[70vh] overflow-hidden bg-[#050508] text-neutral-100",
  /** 시안 글래스 카드 */
  card:
    "rounded-xl border border-white/10 bg-[rgba(18,18,22,0.72)] shadow-[0_0_40px_rgba(0,0,0,0.35)] backdrop-blur-md",
  input:
    "w-full rounded-md border border-white/15 bg-[rgba(8,8,12,0.85)] px-3 py-3 text-sm text-white outline-none placeholder:text-neutral-600 focus:border-white/50 disabled:opacity-60",
  label: "mb-1.5 block text-[10px] uppercase tracking-widest text-neutral-500",
  muted: "text-neutral-500",
  creamBtn:
    "inline-flex items-center justify-center rounded-md bg-[#f4f1ea] px-5 py-3 text-sm font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-50",
  ghostBtn:
    "inline-flex items-center justify-center rounded-md border border-white/15 bg-white/5 px-5 py-3 text-sm text-white transition-colors hover:border-white/30 disabled:opacity-50",
  yellow: "text-[#FEE500]",
  navActive:
    "rounded-r-md border-l-2 border-[#FEE500] bg-white/10 pl-3 font-medium text-white",
  navIdle:
    "rounded-r-md border-l-2 border-transparent pl-3 text-neutral-400 hover:bg-white/5 hover:text-white",
} as const;
