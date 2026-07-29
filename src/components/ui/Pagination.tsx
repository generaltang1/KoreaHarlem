import Link from "next/link";
import { buildPageUrl } from "@/lib/pagination";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  basePath: string;
  params?: Record<string, string | undefined>;
}

export function Pagination({
  currentPage,
  totalPages,
  basePath,
  params,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav
      aria-label="페이지네이션"
      className="mt-12 flex items-center justify-center gap-1"
    >
      {currentPage > 1 ? (
        <Link
          href={buildPageUrl(basePath, currentPage - 1, params)}
          className="border border-border px-3 py-2 text-[10px] uppercase tracking-widest transition-colors hover:border-foreground"
        >
          이전
        </Link>
      ) : (
        <span className="border border-border px-3 py-2 text-[10px] uppercase tracking-widest text-muted opacity-40">
          이전
        </span>
      )}

      <div className="flex items-center gap-1 px-2">
        {pages.map((page) => (
          <Link
            key={page}
            href={buildPageUrl(basePath, page, params)}
            className={`flex h-9 min-w-9 items-center justify-center px-2 text-xs transition-colors ${
              page === currentPage
                ? "bg-foreground text-background"
                : "border border-border hover:border-foreground"
            }`}
            aria-current={page === currentPage ? "page" : undefined}
          >
            {page}
          </Link>
        ))}
      </div>

      {currentPage < totalPages ? (
        <Link
          href={buildPageUrl(basePath, currentPage + 1, params)}
          className="border border-border px-3 py-2 text-[10px] uppercase tracking-widest transition-colors hover:border-foreground"
        >
          다음
        </Link>
      ) : (
        <span className="border border-border px-3 py-2 text-[10px] uppercase tracking-widest text-muted opacity-40">
          다음
        </span>
      )}
    </nav>
  );
}
