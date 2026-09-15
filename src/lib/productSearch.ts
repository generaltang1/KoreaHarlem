import type { SupabaseClient } from "@supabase/supabase-js";
import type { ProductMerchSubcategory, ProductStoreCategory } from "@/lib/productCategories";
import type { ProductWithImages } from "@/lib/products";
import { isSoldOut } from "@/lib/products";
import { fetchSizeStockMaps } from "@/lib/productSizeStock";
import { toIlikePattern } from "@/lib/search";

export interface AdminProductRow {
  id: string;
  title: string;
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
      "id, title, price_krw, stock, category, subcategory, is_published, is_sale, show_stock, created_at, product_images(url, sort_order)",
      { count: "exact" },
    )
    .order("created_at", { ascending: false });

  const q = options.q?.trim();
  if (q) {
    query = query.ilike("title", toIlikePattern(q));
  }

  const { data, count, error } = await query.range(options.from, options.to);

  if (error) {
    console.error("searchProductsPaged:", error.message);
    return { data: [], count: 0 };
  }

  return {
    data: (data ?? []) as AdminProductRow[],
    count: count ?? 0,
  };
}

/**
 * Public In Store listing —
 * 진열함(is_published) + 품절 아님.
 * products.stock 과 product_size_stock 이 어긋나도 사이즈 재고를 기준으로 판정.
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
    .select("*, product_images(*)")
    .eq("is_published", true)
    .order("created_at", { ascending: false });

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

  // 페이지네이션 전에 품절을 걸러야 하므로 여유 있게 가져온 뒤 슬라이스
  const fetchLimit = Math.max(options.to + 1, 200);
  const { data, error } = await query.limit(fetchLimit);

  if (error) {
    return { data: [], count: 0, error: error.message };
  }

  const rows = (data ?? []) as ProductWithImages[];
  const stockMaps = await fetchSizeStockMaps(
    supabase,
    rows.map((p) => p.id),
  );

  const available = rows.filter((product) => {
    const sizeStocks = stockMaps.get(product.id);
    // size stock 행이 있으면 그 기준, 없으면 products.stock
    if (sizeStocks && Object.keys(sizeStocks).length > 0) {
      return !isSoldOut({ ...product, sizeStocks });
    }
    return (product.stock ?? 0) > 0;
  });

  const page = available.slice(options.from, options.to + 1);

  return {
    data: page,
    count: available.length,
    error: null,
  };
}
