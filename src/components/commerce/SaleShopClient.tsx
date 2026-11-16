"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { ProductWithImages } from "@/lib/products";
import { ProductCard } from "@/components/commerce/ProductCard";
import { Pagination } from "@/components/ui/Pagination";
import { ListToolbar } from "@/components/ui/ListToolbar";
import { listParams } from "@/lib/pagination";

const TABS: { label: string; href: string }[] = [
  { label: "전체", href: "/sale" },
  { label: "Tops", href: "/sale?category=merch&sub=tops" },
  { label: "Bottoms", href: "/sale?category=merch&sub=bottoms" },
  { label: "Accessory", href: "/sale?category=merch&sub=accessory" },
  { label: "CD & Vinyl", href: "/sale?category=cd" },
  { label: "Ticket", href: "/sale?category=ticket" },
];

function tabActive(href: string, pathname: string, search: string) {
  const cur = new URL(`${pathname}${search ? `?${search}` : ""}`, "http://local");
  if (href === "/sale") {
    return !cur.searchParams.get("category");
  }
  const u = new URL(href, "http://local");
  if (u.searchParams.get("category") !== cur.searchParams.get("category")) return false;
  if (u.searchParams.has("sub")) {
    return u.searchParams.get("sub") === cur.searchParams.get("sub");
  }
  return !cur.searchParams.get("sub");
}

type SaleShopClientProps = {
  products: ProductWithImages[];
  count: number;
  page: number;
  totalPages: number;
  pageSize: number;
  q: string;
  categoryParam?: string;
  subParam?: string;
  pageTitle: string;
  error?: string | null;
};

export function SaleShopClient({
  products,
  count,
  page,
  totalPages,
  pageSize,
  q,
  categoryParam,
  subParam,
  pageTitle,
  error,
}: SaleShopClientProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const [scatterSeed, setScatterSeed] = useState(0);

  const ordered = useMemo(() => {
    if (!scatterSeed) return products;
    const copy = [...products];
    let s = scatterSeed;
    for (let i = copy.length - 1; i > 0; i -= 1) {
      s = (s * 1664525 + 1013904223) >>> 0;
      const j = s % (i + 1);
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }, [products, scatterSeed]);

  return (
    <div className="relative min-h-[70vh] text-[#f4f1ea]">
      <ListToolbar
        searchPlaceholder="상품명 검색"
        preserveParams={["size", "category", "sub", "q"]}
      />

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#a8a49b]">In Store</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
            코리아할렘 암시장
          </h1>
          <p className="mt-1 text-xs text-[#a8a49b]">
            {pageTitle}
            {" · "}
            {q ? `“${q}” 검색 ${count}건` : `총 ${count}건`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setScatterSeed((n) => (n || Date.now()) + 1)}
          className="self-start rounded-full border border-[rgba(244,241,234,0.2)] px-4 py-2 text-[10px] uppercase tracking-widest text-[#f4f1ea] transition hover:border-[#f4f1ea]"
        >
          Scatter
        </button>
      </div>

      <nav className="mb-8 flex gap-1 overflow-x-auto border-b border-[rgba(244,241,234,0.12)] pb-px">
        {TABS.map((tab) => {
          const active = tabActive(tab.href, pathname, search);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`shrink-0 px-3 py-2.5 text-xs tracking-wide transition sm:px-4 ${
                active
                  ? "border-b-2 border-[#FEE500] font-semibold text-[#FEE500]"
                  : "text-[#a8a49b] hover:text-[#f4f1ea]"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      {error ? (
        <div className="border border-[rgba(244,241,234,0.12)] px-6 py-16 text-center">
          <p className="text-sm text-[#a8a49b]">
            {error.includes("category")
              ? "Supabase에서 `supabase/add_product_category.sql`을 실행해주세요."
              : "상품 테이블이 아직 없습니다. Supabase에서 `supabase/add_products.sql`을 실행해주세요."}
          </p>
        </div>
      ) : ordered.length === 0 ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <p className="text-sm text-[#a8a49b]">
            {q ? "검색 결과가 없습니다." : "등록된 상품이 없습니다."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-3">
          {ordered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        basePath="/sale"
        params={listParams({
          pageSize,
          q,
          category: categoryParam,
          sub: subParam,
        })}
      />
    </div>
  );
}
