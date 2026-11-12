/** 마이페이지·커머스 F 섹션 다크 톤 (G/I/Admin과 동일 계열) */

export const mp = {
  page: "min-h-[70vh] bg-[#0a0a0a] text-neutral-100",
  card: "border border-[#262626] bg-[#151515]",
  input:
    "w-full border border-[#333] bg-[#0c0c0c] px-3 py-3 text-sm text-white outline-none placeholder:text-neutral-600 focus:border-white disabled:opacity-60",
  label: "mb-1.5 block text-[10px] uppercase tracking-widest text-neutral-500",
  muted: "text-neutral-500",
  creamBtn:
    "inline-flex items-center justify-center bg-[#f4f1ea] px-5 py-3 text-sm font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-50",
  ghostBtn:
    "inline-flex items-center justify-center border border-[#333] bg-[#1c1c1c] px-5 py-3 text-sm text-white transition-colors hover:border-neutral-500 disabled:opacity-50",
  yellow: "text-[#FEE500]",
  navActive: "border-l-2 border-[#FEE500] bg-[#151515] pl-3 font-medium text-white",
  navIdle: "border-l-2 border-transparent pl-3 text-neutral-400 hover:text-white",
} as const;
