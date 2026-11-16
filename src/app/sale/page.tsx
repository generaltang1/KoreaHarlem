import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CommerceAtmosphere } from "@/components/mypage/CommerceAtmosphere";
import { SaleShopClient } from "@/components/commerce/SaleShopClient";
import { searchSaleProductsPaged } from "@/lib/productSearch";
import { parseSaleCategoryFilter, salePageTitle } from "@/lib/productCategories";
import {
  getRange,
  getTotalPages,
  parsePage,
  parsePageSize,
} from "@/lib/pagination";
import { parseSearchQuery } from "@/lib/search";

interface SalePageProps {
  searchParams: Promise<{
    page?: string;
    size?: string;
    q?: string;
    category?: string;
    sub?: string;
  }>;
}

export default async function SalePage({ searchParams }: SalePageProps) {
  const { page: pageParam, size: sizeParam, q: qParam, category: categoryParam, sub: subParam } =
    await searchParams;
  const page = parsePage(pageParam);
  const pageSize = parsePageSize(sizeParam);
  const q = parseSearchQuery(qParam);
  const { from, to } = getRange(page, pageSize);
  const { category, subcategory } = parseSaleCategoryFilter(categoryParam, subParam);
  const pageTitle = salePageTitle(categoryParam, subParam);

  const supabase = await createClient();
  const { data: products, count, error } = await searchSaleProductsPaged(supabase, {
    q,
    category,
    subcategory,
    from,
    to,
  });
  const totalPages = getTotalPages(count, pageSize);

  return (
    <>
      <Header />
      <CommerceAtmosphere className="px-4 py-10 pb-24 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <Suspense fallback={null}>
            <SaleShopClient
              products={products}
              count={count}
              page={page}
              totalPages={totalPages}
              pageSize={pageSize}
              q={q}
              categoryParam={categoryParam}
              subParam={subParam}
              pageTitle={pageTitle}
              error={error}
            />
          </Suspense>
        </div>
      </CommerceAtmosphere>
      <Footer />
    </>
  );
}
