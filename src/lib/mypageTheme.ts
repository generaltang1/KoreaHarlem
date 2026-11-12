import type { CSSProperties } from "react";

/**
 * F 섹션 시안 토큰 (Figma Website F-06/F-10)
 * glass/fill: rgba(244,241,234,0.05)
 * glass/line: rgba(244,241,234,0.12)
 * fg/primary: #f4f1ea
 * accent: #fbc201 / #FEE500
 * card radius: 12px · button radius: 6px
 */

export const mpAtmosphereStyle: CSSProperties = {
  backgroundImage: [
    "radial-gradient(ellipse 55% 35% at 50% 18%, rgba(30,41,59,0.45), transparent 70%)",
    "radial-gradient(ellipse 40% 35% at 15% 72%, rgba(20,25,35,0.55), transparent 65%)",
    "radial-gradient(ellipse 35% 30% at 88% 62%, rgba(25,20,40,0.45), transparent 60%)",
  ].join(", "),
};

export const mp = {
  page: "relative min-h-[70vh] overflow-hidden bg-[#0a0a0a] text-[#f4f1ea] [font-family:var(--font-f-sans),var(--font-geist-sans),sans-serif]",
  card:
    "rounded-[12px] border border-[rgba(244,241,234,0.12)] bg-[rgba(244,241,234,0.05)] backdrop-blur-[6px]",
  input:
    "w-full rounded-[8px] border border-[rgba(244,241,234,0.12)] bg-[rgba(244,241,234,0.05)] px-3.5 py-3 text-[13px] text-[#f4f1ea] outline-none placeholder:text-[#6e6b65] focus:border-[rgba(244,241,234,0.35)] disabled:opacity-60",
  label: "mb-1.5 block text-[11px] font-medium tracking-wide text-[#a8a49b]",
  muted: "text-[#a8a49b]",
  tertiary: "text-[#6e6b65]",
  creamBtn:
    "inline-flex items-center justify-center rounded-[8px] bg-[#f4f1ea] px-6 py-3 text-sm font-semibold text-[#0a0a0a] transition-opacity hover:opacity-90 disabled:opacity-50",
  ghostBtn:
    "inline-flex items-center justify-center rounded-[6px] border border-[rgba(244,241,234,0.12)] bg-transparent px-3.5 py-2 text-sm text-[#f4f1ea] transition-colors hover:bg-[rgba(244,241,234,0.06)] disabled:opacity-50",
  yellow: "text-[#fbc201]",
  accent: "text-[#FEE500]",
  divide: "divide-[rgba(244,241,234,0.12)]",
  chip:
    "rounded-[8px] border border-[rgba(244,241,234,0.12)] bg-[rgba(244,241,234,0.05)] px-3 py-3 text-center transition-colors hover:border-[rgba(251,194,1,0.45)]",
  pill:
    "inline-flex items-center justify-center rounded-[6px] border border-[rgba(244,241,234,0.12)] bg-transparent px-3 py-1.5 text-xs text-[#f4f1ea] transition-colors hover:bg-[rgba(244,241,234,0.06)]",
  pillActive:
    "inline-flex items-center justify-center rounded-[6px] border border-[#fbc201] bg-[rgba(251,194,1,0.08)] px-3 py-1.5 text-xs font-medium text-[#fbc201]",
  badge:
    "inline-flex items-center rounded-[2px] bg-[#FEE500] px-2.5 py-1 text-xs font-semibold text-[#191919]",
  thumb: "relative shrink-0 overflow-hidden rounded-[6px] bg-[rgba(244,241,234,0.05)]",
  navActive:
    "border-l-2 border-[#fbc201] pl-3.5 py-3 text-sm font-bold text-[#f4f1ea]",
  navIdle:
    "border-l-2 border-transparent pl-3.5 py-3 text-sm font-medium text-[#a8a49b] transition-colors hover:text-[#f4f1ea]",
} as const;
