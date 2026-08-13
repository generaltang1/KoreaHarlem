import type { SupabaseClient } from "@supabase/supabase-js";
import type { ProductMerchSubcategory, ProductStoreCategory } from "@/lib/productCategories";
import type { ProductWithImages } from "@/lib/products";
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
      "id, title, price_krw, stock, category, subcategory, is_published, is_sale, created_at, product_images(url, sort_order)",
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

/** Public In Store listing — 진열함(is_published) 상품만. 판매안함도 목록·상세 노출. */
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
    query = query.or(`title.ilike."${pattern}",description.ilike."${pattern}"`);
  }

  const { data, count, error } = await query.range(options.from, options.to);

  if (error) {
    return { data: [], count: 0, error: error.message };
  }

  return {
    data: (data ?? []) as ProductWithImages[],
    count: count ?? 0,
    error: null,
  };
}
