import Link from "next/link";
import { buildPageUrl } from "@/lib/pagination";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  basePath: string;
  params?: Record<string, string | undefined>;
  /** 음악/아티스트 다크 시안 톤 */
  tone?: "default" | "dark";
}

export function Pagination({
  currentPage,
  totalPages,
  basePath,
  params,
  tone = "default",
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  const dark = tone === "dark";
  const edge = dark
    ? "border border-[#262626] bg-[#151515] px-3 py-2 text-[10px] uppercase tracking-widest text-[#a8a49b] transition-colors hover:border-[#a8a49b] hover:text-[#f4f1ea]"
    : "border border-border px-3 py-2 text-[10px] uppercase tracking-widest transition-colors hover:border-foreground";
  const edgeOff = dark
    ? "border border-[#262626] bg-[#151515] px-3 py-2 text-[10px] uppercase tracking-widest text-[#6e6b65] opacity-40"
    : "border border-border px-3 py-2 text-[10px] uppercase tracking-widest text-muted opacity-40";
  const pageOn = dark ? "bg-[#f4f1ea] text-[#0a0a0a]" : "bg-foreground text-background";
  const pageOff = dark
    ? "border border-[#262626] bg-[#151515] text-[#a8a49b] hover:border-[#a8a49b] hover:text-[#f4f1ea]"
    : "border border-border hover:border-foreground";

  return (
    <nav
      aria-label="페이지네이션"
      className="mt-12 flex items-center justify-center gap-1"
    >
      {currentPage > 1 ? (
        <Link href={buildPageUrl(basePath, currentPage - 1, params)} className={edge}>
          이전
        </Link>
      ) : (
        <span className={edgeOff}>이전</span>
      )}

      <div className="flex items-center gap-1 px-2">
        {pages.map((page) => (
          <Link
            key={page}
            href={buildPageUrl(basePath, page, params)}
            className={`flex h-9 min-w-9 items-center justify-center px-2 text-xs transition-colors ${
              page === currentPage ? pageOn : pageOff
            }`}
            aria-current={page === currentPage ? "page" : undefined}
          >
            {page}
          </Link>
        ))}
      </div>

      {currentPage < totalPages ? (
        <Link href={buildPageUrl(basePath, currentPage + 1, params)} className={edge}>
          다음
        </Link>
      ) : (
        <span className={edgeOff}>다음</span>
      )}
    </nav>
  );
}
