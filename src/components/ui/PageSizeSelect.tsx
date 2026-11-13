"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from "@/lib/pagination";

interface PageSizeSelectProps {
  /** Preserve other query params (e.g. category) when size changes */
  preserveParams?: string[];
  /** 음악/아티스트 다크 시안 톤 */
  tone?: "default" | "dark";
}

export function PageSizeSelect({ preserveParams = [], tone = "default" }: PageSizeSelectProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const current = Number.parseInt(
    searchParams.get("size") ?? String(DEFAULT_PAGE_SIZE),
    10,
  );
  const value = (PAGE_SIZE_OPTIONS as readonly number[]).includes(current)
    ? current
    : DEFAULT_PAGE_SIZE;

  const handleChange = (nextSize: string) => {
    const params = new URLSearchParams();

    for (const key of preserveParams) {
      const existing = searchParams.get(key);
      if (existing) params.set(key, existing);
    }

    // Always keep active search query unless explicitly omitted.
    if (!preserveParams.includes("q")) {
      const q = searchParams.get("q");
      if (q) params.set("q", q);
    }

    const sizeNum = Number.parseInt(nextSize, 10);
    if (sizeNum !== DEFAULT_PAGE_SIZE) {
      params.set("size", String(sizeNum));
    }

    // Reset to first page when page size changes.
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };

  return (
    <div>
      <label
        className={`inline-flex items-center gap-2 text-[10px] uppercase tracking-widest ${
          tone === "dark" ? "text-[#6e6b65]" : "text-muted"
        }`}
      >
        <span className="sr-only">페이지당 개수</span>
        <select
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          className={
            tone === "dark"
              ? "border border-[#262626] bg-[#151515] px-3 py-1.5 text-[11px] tracking-[0.04em] text-[#a8a49b] outline-none focus:border-[#a8a49b]"
              : "border border-border bg-background px-3 py-2 text-[10px] uppercase tracking-widest outline-none focus:border-foreground"
          }
          aria-label="페이지당 개수"
        >
          {PAGE_SIZE_OPTIONS.map((size) => (
            <option key={size} value={size}>
              {size}개씩 보기
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
