/**
 * Figma Website 공통 토큰 (G / I / F 스토어프론트)
 * glass/fill: #f4f1ea0d · glass/line: #f4f1ea1f · bg/base: #0a0a0a
 */
export const site = {
  bg: "bg-[#0a0a0a] text-[#f4f1ea]",
  font: "[font-family:var(--font-f-sans),var(--font-geist-sans),sans-serif]",
  glass:
    "rounded-[12px] border border-[rgba(244,241,234,0.12)] bg-[rgba(244,241,234,0.05)] backdrop-blur-[6px]",
  glassModal:
    "rounded-[20px] border border-[rgba(244,241,234,0.12)] bg-[#141414]/95 shadow-[0_0_60px_rgba(0,0,0,0.55)] backdrop-blur-[10px]",
  input:
    "w-full rounded-[8px] border border-[rgba(244,241,234,0.12)] bg-[rgba(244,241,234,0.05)] px-3.5 py-3 text-sm text-[#f4f1ea] outline-none placeholder:text-[#6e6b65] focus:border-[rgba(244,241,234,0.35)]",
  label: "mb-1.5 block text-[11px] font-medium tracking-wide text-[#a8a49b]",
  muted: "text-[#a8a49b]",
  tertiary: "text-[#6e6b65]",
  accent: "text-[#FEE500]",
  creamBtn:
    "inline-flex items-center justify-center rounded-[8px] bg-[#f4f1ea] px-5 py-3.5 text-sm font-semibold text-[#0a0a0a] transition-opacity hover:opacity-90 disabled:opacity-50",
  yellowBtn:
    "inline-flex items-center justify-center rounded-[8px] bg-[#FEE500] px-5 py-3.5 text-sm font-semibold text-[#191919] transition-opacity hover:opacity-90 disabled:opacity-50",
  ghostBtn:
    "inline-flex items-center justify-center rounded-[8px] border border-[rgba(244,241,234,0.12)] bg-transparent px-5 py-3.5 text-sm text-[#f4f1ea] transition-colors hover:bg-[rgba(244,241,234,0.06)] disabled:opacity-50",
  pill:
    "inline-flex items-center justify-center rounded-[6px] border border-[rgba(244,241,234,0.12)] px-3 py-1.5 text-xs text-[#f4f1ea] transition-colors hover:bg-[rgba(244,241,234,0.06)]",
  pillActive:
    "inline-flex items-center justify-center rounded-[6px] bg-[#f4f1ea] px-3 py-1.5 text-xs font-medium text-[#0a0a0a]",
  divide: "divide-[rgba(244,241,234,0.12)]",
  line: "border-[rgba(244,241,234,0.12)]",
} as const;

/** Figma Admin H — 라이트 콘텐츠 영역 (헤더는 다크 사이트 크롬) */
export const adminLight = {
  page: "bg-[#f8f9fa] text-[#0a0a0a]",
  card: "rounded-[12px] border border-[#e8e8e8] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]",
  cardPad: "rounded-[12px] border border-[#e8e8e8] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]",
  muted: "text-[#737373]",
  label: "text-[10px] font-medium uppercase tracking-[0.18em] text-[#737373]",
  input:
    "w-full rounded-[8px] border border-[#d4d4d4] bg-white px-3 py-2.5 text-sm text-[#0a0a0a] outline-none placeholder:text-[#a3a3a3] focus:border-[#0a0a0a]",
  select:
    "rounded-[8px] border border-[#d4d4d4] bg-white px-3 py-2 text-sm text-[#0a0a0a] outline-none focus:border-[#0a0a0a]",
  btnPrimary:
    "inline-flex items-center justify-center rounded-[8px] bg-[#0a0a0a] px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white transition hover:opacity-90",
  btnGhost:
    "inline-flex items-center justify-center rounded-[8px] border border-[#d4d4d4] bg-white px-4 py-2 text-xs uppercase tracking-widest text-[#0a0a0a] transition hover:border-[#0a0a0a]",
  btnAccent:
    "inline-flex items-center justify-center rounded-[8px] bg-[#FEE500] px-4 py-2 text-xs font-semibold uppercase tracking-widest text-[#0a0a0a] transition hover:opacity-90",
  tableHead: "border-b border-[#e8e8e8] text-left text-[10px] uppercase tracking-widest text-[#737373]",
  tableRow: "border-b border-[#e8e8e8] text-sm text-[#0a0a0a]",
  link: "text-[#0a0a0a] underline-offset-2 hover:underline",
  kpi:
    "rounded-[12px] border border-[#e8e8e8] bg-[#f3f0ff] px-3 py-3 text-center",
  kpiDanger:
    "rounded-[12px] border border-[#fecaca] bg-[#fff1f2] px-3 py-3 text-center",
} as const;
