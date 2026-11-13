/** C Magazine 공개면 — Figma C 보드 다크 글래스 톤 */
export const mag = {
  page: "relative min-h-[70vh] overflow-hidden bg-[#0a0a0a] text-[#f4f1ea] [font-family:var(--font-f-sans),var(--font-geist-sans),sans-serif]",
  card: "rounded-[12px] border border-[rgba(244,241,234,0.12)] bg-[rgba(244,241,234,0.05)] backdrop-blur-[6px]",
  muted: "text-[#a8a49b]",
  tertiary: "text-[#6e6b65]",
  accent: "text-[#FEE500]",
  pill: "inline-flex items-center rounded-[6px] border border-[rgba(244,241,234,0.12)] px-3 py-1.5 text-xs text-[#f4f1ea] transition-colors hover:bg-[rgba(244,241,234,0.06)]",
  pillActive: "inline-flex items-center rounded-[6px] bg-[#FEE500] px-3 py-1.5 text-xs font-semibold text-[#191919]",
  creamBtn:
    "inline-flex items-center justify-center rounded-[8px] bg-[#f4f1ea] px-5 py-3 text-sm font-semibold text-[#0a0a0a] transition-opacity hover:opacity-90",
  yellowBtn:
    "inline-flex items-center justify-center rounded-[8px] bg-[#FEE500] px-5 py-3 text-sm font-semibold text-[#191919] transition-opacity hover:opacity-90",
} as const;
