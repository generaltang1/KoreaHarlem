"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { ProductWithImages } from "@/lib/products";
import { getProductImages } from "@/lib/products";
import {
  MERCH_SUBCATEGORIES,
  PRODUCT_CATEGORIES,
  type ProductMerchSubcategory,
  type ProductStoreCategory,
} from "@/lib/productCategories";

type FilterKey = "all" | ProductStoreCategory | `merch:${ProductMerchSubcategory}`;

type HomeStoreProps = {
  products: ProductWithImages[];
};

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "ALL" },
  ...MERCH_SUBCATEGORIES.map((s) => ({
    key: `merch:${s.value}` as FilterKey,
    label: s.label,
  })),
  ...PRODUCT_CATEGORIES.filter((c) => c.value !== "merch").map((c) => ({
    key: c.value as FilterKey,
    label: c.label,
  })),
];

function matchesFilter(product: ProductWithImages, filter: FilterKey) {
  if (filter === "all") return true;
  if (filter.startsWith("merch:")) {
    const sub = filter.slice(6) as ProductMerchSubcategory;
    return product.category === "merch" && product.subcategory === sub;
  }
  return product.category === filter;
}

export function HomeStore({ products }: HomeStoreProps) {
  const [filter, setFilter] = useState<FilterKey>("all");

  const filtered = useMemo(() => {
    return products.filter((p) => matchesFilter(p, filter)).slice(0, 5);
  }, [products, filter]);

  const moreHref = useMemo(() => {
    if (filter === "all") return "/sale";
    if (filter.startsWith("merch:")) {
      const sub = filter.slice(6);
      return `/sale?category=merch&sub=${sub}`;
    }
    return `/sale?category=${filter}`;
  }, [filter]);

  return (
    <section
      id="store-section"
      className="border-b border-neutral-800 bg-[#0a0a0c] px-4 py-16 text-neutral-100 sm:px-8 sm:py-24"
    >
      <div className="mx-auto max-w-[1720px]">
        <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h2 className="text-3xl font-black uppercase tracking-tight sm:text-5xl">Store</h2>
            <p className="mt-1 text-sm text-neutral-400">In Store 셀렉션</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={`rounded-sm px-3 py-1.5 transition-colors ${
                  filter === f.key
                    ? "bg-white font-bold text-black"
                    : "border border-neutral-800 bg-neutral-900 text-neutral-300 hover:border-neutral-600"
                }`}
              >
                {f.label}
              </button>
            ))}
            <Link
              href={moreHref}
              className="ml-2 text-xs uppercase tracking-widest text-neutral-400 hover:text-white"
            >
              More →
            </Link>
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className="text-sm text-neutral-500">해당 카테고리 상품이 없습니다.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 sm:gap-6">
            {filtered.map((product) => {
              const img = getProductImages(product)[0];
              return (
                <Link
                  key={product.id}
                  href={`/sale/${product.id}`}
                  className="group flex flex-col overflow-hidden rounded-sm border border-neutral-800 bg-neutral-900/40 transition hover:border-neutral-500"
                >
                  <div className="relative aspect-[4/5] bg-neutral-950">
                    {img ? (
                      <Image
                        src={img}
                        alt={product.title}
                        fill
                        className="object-cover transition duration-500 group-hover:scale-105"
                        sizes="20vw"
                      />
                    ) : null}
                  </div>
                  <div className="space-y-2 p-4">
                    <h3 className="line-clamp-2 text-sm font-bold text-neutral-200 group-hover:text-white">
                      {product.title}
                    </h3>
                    <p className="font-mono text-[11px] font-bold text-white">
                      {product.price_krw.toLocaleString("ko-KR")} KRW
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
