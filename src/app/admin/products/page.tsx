import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AdminProductsList } from "@/components/admin/AdminProductsList";
import { Pagination } from "@/components/ui/Pagination";
import { ListToolbar } from "@/components/ui/ListToolbar";
import { searchProductsPaged } from "@/lib/productSearch";
import {
  getRange,
  getTotalPages,
  listParams,
  parsePage,
  parsePageSize,
} from "@/lib/pagination";
import { parseSearchQuery } from "@/lib/search";

interface AdminProductsPageProps {
  searchParams: Promise<{ page?: string; size?: string; q?: string }>;
}

export default async function AdminProductsPage({ searchParams }: AdminProductsPageProps) {
  const { page: pageParam, size: sizeParam, q: qParam } = await searchParams;
  const page = parsePage(pageParam);
  const pageSize = parsePageSize(sizeParam);
  const q = parseSearchQuery(qParam);
  const { from, to } = getRange(page, pageSize);

  const supabase = await createClient();
  const { data: products, count } = await searchProductsPaged(supabase, { q, from, to });

  const totalPages = getTotalPages(count, pageSize);

  const items = products.map((product) => {
    const sorted = [...(product.product_images ?? [])].sort(
      (a, b) => a.sort_order - b.sort_order,
    );
    return {
      id: product.id,
      title: product.title,
      price_krw: product.price_krw,
      stock: product.stock,
      category: product.category ?? "merch",
      subcategory: product.subcategory ?? null,
      is_published: product.is_published,
      created_at: product.created_at,
      image_url: sorted[0]?.url ?? null,
    };
  });

  return (
    <div>
      <ListToolbar searchPlaceholder="상품명 검색" />
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted">Admin</p>
          <h1 className="mt-1 text-xl font-medium uppercase tracking-wider">상품 관리</h1>
          <p className="mt-2 text-xs text-muted">
            {q ? `“${q}” 검색 결과 ${count}건` : `총 ${count}건`}
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="border border-border px-4 py-2 text-[10px] uppercase tracking-widest transition-colors hover:border-foreground"
        >
          + 상품 등록
        </Link>
      </div>

      <AdminProductsList products={items} />
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        basePath="/admin/products"
        params={listParams({ pageSize, q })}
      />
    </div>
  );
}
