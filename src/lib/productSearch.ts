import type { SupabaseClient } from "@supabase/supabase-js";
import type { ProductMerchSubcategory, ProductStoreCategory } from "@/lib/productCategories";
import type { ProductWithImages } from "@/lib/products";
import { fetchSizeStockMaps } from "@/lib/productSizeStock";
import { toIlikePattern } from "@/lib/search";

export interface AdminProductRow {
  id: string;
  title: string;
  title_en?: string | null;
  price_krw: number;
  stock: number;
  category: string;
  subcategory: string | null;
  is_published: boolean;
  is_sale: boolean;
  show_stock?: boolean;
  created_at: string;
  product_images: { url: string; sort_order: number }[];
}

export async function searchProductsPaged(
  supabase: SupabaseClient,
  options: { q?: string; from: number; to: number },
): Promise<{ data: AdminProductRow[]; count: number }> {
  let query = supabase
    .from("products")
    .select(
      "id, title, title_en, price_krw, stock, category, subcategory, is_published, is_sale, show_stock, created_at, product_images(url, sort_order)",
      { count: "exact" },
    )
    .order("created_at", { ascending: false });

  const q = options.q?.trim();
  if (q) {
    query = query.ilike("title", toIlikePattern(q));
  }

  let { data, count, error } = await query.range(options.from, options.to);

  // title_en 컬럼이 아직 없으면 기존 select로 재시도
  if (error && /title_en/i.test(error.message)) {
    let fallback = supabase
      .from("products")
      .select(
        "id, title, price_krw, stock, category, subcategory, is_published, is_sale, show_stock, created_at, product_images(url, sort_order)",
        { count: "exact" },
      )
      .order("created_at", { ascending: false });
    if (q) {
      fallback = fallback.ilike("title", toIlikePattern(q));
    }
    const retry = await fallback.range(options.from, options.to);
    data = (retry.data ?? []).map((row) => ({ ...row, title_en: null }));
    count = retry.count;
    error = retry.error;
  }

  if (error) {
    console.error("searchProductsPaged:", error.message);
    return { data: [], count: 0 };
  }

  return {
    data: (data ?? []).map((row) => ({
      ...row,
      title_en: "title_en" in row ? (row as { title_en?: string | null }).title_en ?? null : null,
    })) as AdminProductRow[],
    count: count ?? 0,
  };
}

/**
 * Public In Store listing —
 * 진열함(is_published). 품절 상품도 목록에 표시(사이즈 재고 맵 첨부).
 */
export async function searchSaleProductsPaged(
  supabase: SupabaseClient,
  options: {
    q?: string;
    category?: ProductStoreCategory;
    subcategory?: ProductMerchSubcategory;
    from: number;
    to: number;
  },
): Promise<{ data: ProductWithImages[]; count: number; error: string | null }> {
  let query = supabase
    .from("products")
    .select("*, product_images(*)", { count: "exact" })
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .range(options.from, options.to);

  if (options.category) {
    query = query.eq("category", options.category);
  }
  if (options.subcategory) {
    query = query.eq("subcategory", options.subcategory);
  }

  const q = options.q?.trim();
  if (q) {
    const pattern = toIlikePattern(q);
    query = query.ilike("title", pattern);
  }

  const { data, error, count } = await query;

  if (error) {
    return { data: [], count: 0, error: error.message };
  }

  const rows = (data ?? []) as ProductWithImages[];
  const stockMaps = await fetchSizeStockMaps(
    supabase,
    rows.map((p) => p.id),
  );

  const page = rows.map((product) => ({
    ...product,
    sizeStocks: stockMaps.get(product.id) ?? {},
  }));

  return {
    data: page,
    count: count ?? page.length,
    error: null,
  };
}
