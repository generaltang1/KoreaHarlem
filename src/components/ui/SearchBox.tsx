"use client";

import { FormEvent, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";

interface SearchBoxProps {
  placeholder?: string;
  /** Query keys to keep when submitting search (size, category, ...) */
  preserveParams?: string[];
}

export function SearchBox({
  placeholder = "검색어 입력",
  preserveParams = ["size", "category"],
}: SearchBoxProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get("q") ?? "");

  useEffect(() => {
    setValue(searchParams.get("q") ?? "");
  }, [searchParams]);


  const submit = (e: FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();

    for (const key of preserveParams) {
      const existing = searchParams.get(key);
      if (existing) params.set(key, existing);
    }

    // Keep size even if not in preserve list and currently set.
    const size = searchParams.get("size");
    if (size && size !== String(DEFAULT_PAGE_SIZE) && !params.has("size")) {
      params.set("size", size);
    }

    const q = value.trim();
    if (q) params.set("q", q);

    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };

  const clear = () => {
    setValue("");
    const params = new URLSearchParams();
    for (const key of preserveParams) {
      const existing = searchParams.get(key);
      if (existing) params.set(key, existing);
    }
    const size = searchParams.get("size");
    if (size && size !== String(DEFAULT_PAGE_SIZE) && !params.has("size")) {
      params.set("size", size);
    }
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };

  return (
    <form onSubmit={submit} className="flex min-w-0 flex-1 items-center gap-2 sm:max-w-md">
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="min-w-0 flex-1 border border-border bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted focus:border-foreground"
      />
      <button
        type="submit"
        className="shrink-0 border border-border px-3 py-2 text-[10px] uppercase tracking-widest transition-colors hover:border-foreground"
      >
        검색
      </button>
      {(searchParams.get("q") || value) && (
        <button
          type="button"
          onClick={clear}
          className="shrink-0 text-[10px] uppercase tracking-widest text-muted underline"
        >
          초기화
        </button>
      )}
    </form>
  );
}
