import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ProductCard } from "@/components/commerce/ProductCard";
import { Pagination } from "@/components/ui/Pagination";
import { ListToolbar } from "@/components/ui/ListToolbar";
import { searchSaleProductsPaged } from "@/lib/productSearch";
import {
  getRange,
  getTotalPages,
  listParams,
  parsePage,
  parsePageSize,
} from "@/lib/pagination";
import { parseSearchQuery } from "@/lib/search";

interface SalePageProps {
  searchParams: Promise<{ page?: string; size?: string; q?: string }>;
}

export default async function SalePage({ searchParams }: SalePageProps) {
  const { page: pageParam, size: sizeParam, q: qParam } = await searchParams;
  const page = parsePage(pageParam);
  const pageSize = parsePageSize(sizeParam);
  const q = parseSearchQuery(qParam);
  const { from, to } = getRange(page, pageSize);

  const supabase = await createClient();
  const { data: products, count, error } = await searchSaleProductsPaged(supabase, {
    q,
    from,
    to,
  });
  const totalPages = getTotalPages(count, pageSize);

  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-10 pb-24 md:px-6">
        <ListToolbar searchPlaceholder="상품명 검색" />
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted">Shop</p>
            <h1 className="mt-1 text-2xl font-medium uppercase tracking-wider">Sale</h1>
            <p className="mt-2 text-xs text-muted">
              {q ? `“${q}” 검색 결과 ${count}건` : `총 ${count}건`}
            </p>
          </div>
        </div>

        {error ? (
          <div className="border border-border px-6 py-16 text-center">
            <p className="text-sm text-muted">
              상품 테이블이 아직 없습니다. Supabase에서 `supabase/add_products.sql`을 실행해주세요.
            </p>
          </div>
        ) : products.length === 0 ? (
          <div className="flex min-h-[40vh] items-center justify-center">
            <p className="text-sm text-muted">
              {q ? "검색 결과가 없습니다." : "등록된 SALE 상품이 없습니다."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        <Pagination
          currentPage={page}
          totalPages={totalPages}
          basePath="/sale"
          params={listParams({ pageSize, q })}
        />
      </main>
      <Footer />
    </>
  );
}
