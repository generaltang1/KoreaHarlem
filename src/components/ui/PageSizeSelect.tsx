"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from "@/lib/pagination";

interface PageSizeSelectProps {
  /** Preserve other query params (e.g. category) when size changes */
  preserveParams?: string[];
}

export function PageSizeSelect({ preserveParams = [] }: PageSizeSelectProps) {
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

    const sizeNum = Number.parseInt(nextSize, 10);
    if (sizeNum !== DEFAULT_PAGE_SIZE) {
      params.set("size", String(sizeNum));
    }

    // Reset to first page when page size changes.
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };

  return (
    <div className="mb-6">
      <label className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted">
        <span className="sr-only">페이지당 개수</span>
        <select
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          className="border border-border bg-background px-3 py-2 text-[10px] uppercase tracking-widest outline-none focus:border-foreground"
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
