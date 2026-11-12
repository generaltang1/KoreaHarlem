/** Admin H 시안 톤 — 다크 셸 + 크림 CTA. 기존 기능 유지용 공통 클래스 */

export const admin = {
  page: "text-[#F4F1EA]",
  card: "rounded-xl border border-[#262626] bg-[#151515]",
  cardPad: "rounded-xl border border-[#262626] bg-[#151515] p-5",
  muted: "text-[#a8a49b]",
  label: "text-[10px] font-medium uppercase tracking-[0.18em] text-[#6e6b65]",
  input:
    "w-full border border-[#333] bg-[#0c0c0c] px-3 py-2.5 text-sm text-[#F4F1EA] outline-none placeholder:text-[#6e6b65] focus:border-[#a8a49b]",
  select:
    "border border-[#333] bg-[#0c0c0c] px-3 py-2 text-sm text-[#F4F1EA] outline-none focus:border-[#a8a49b]",
  btnPrimary:
    "inline-flex items-center justify-center bg-[#f4f1ea] px-4 py-2 text-xs font-semibold uppercase tracking-widest text-black transition hover:opacity-90",
  btnGhost:
    "inline-flex items-center justify-center border border-[#333] bg-transparent px-4 py-2 text-xs uppercase tracking-widest text-[#F4F1EA] transition hover:border-[#a8a49b]",
  btnAccent:
    "inline-flex items-center justify-center bg-[#FEE500] px-4 py-2 text-xs font-semibold uppercase tracking-widest text-black transition hover:opacity-90",
  tableHead: "border-b border-[#262626] text-left text-[10px] uppercase tracking-widest text-[#6e6b65]",
  tableRow: "border-b border-[#262626] text-sm text-[#F4F1EA]",
  link: "text-[#FEE500] underline-offset-2 hover:underline",
} as const;
