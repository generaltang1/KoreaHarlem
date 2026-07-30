import type { SupabaseClient } from "@supabase/supabase-js";
import { rowsToSizeStockMap, type SizeStockMap } from "@/lib/stock";

export async function fetchSizeStockMap(
  supabase: SupabaseClient,
  productId: string,
): Promise<SizeStockMap> {
  const { data } = await supabase
    .from("product_size_stock")
    .select("size, stock")
    .eq("product_id", productId);

  const map = rowsToSizeStockMap(data ?? []);
  if (Object.keys(map).length > 0) return map;

  const { data: product } = await supabase
    .from("products")
    .select("stock, sizes")
    .eq("id", productId)
    .maybeSingle();

  if (!product) return {};
  const keys = (product.sizes ?? []).length > 0 ? (product.sizes as string[]) : [""];
  const fallback: SizeStockMap = {};
  for (const key of keys) fallback[key] = product.stock ?? 0;
  return fallback;
}

export async function fetchSizeStockMaps(
  supabase: SupabaseClient,
  productIds: string[],
): Promise<Map<string, SizeStockMap>> {
  const result = new Map<string, SizeStockMap>();
  if (productIds.length === 0) return result;

  const { data } = await supabase
    .from("product_size_stock")
    .select("product_id, size, stock")
    .in("product_id", productIds);

  for (const row of data ?? []) {
    const map = result.get(row.product_id) ?? {};
    map[row.size ?? ""] = row.stock;
    result.set(row.product_id, map);
  }

  const missing = productIds.filter((id) => !result.has(id) || Object.keys(result.get(id)!).length === 0);
  if (missing.length > 0) {
    const { data: products } = await supabase
      .from("products")
      .select("id, stock, sizes")
      .in("id", missing);
    for (const product of products ?? []) {
      const keys = (product.sizes ?? []).length > 0 ? (product.sizes as string[]) : [""];
      const map: SizeStockMap = {};
      for (const key of keys) map[key] = product.stock ?? 0;
      result.set(product.id, map);
    }
  }

  return result;
}

export async function saveProductSizeStocks(
  supabase: SupabaseClient,
  productId: string,
  sizes: string[],
  stocks: Record<string, number>,
): Promise<void> {
  const keys = sizes.length > 0 ? sizes : [""];

  const { error: delError } = await supabase
    .from("product_size_stock")
    .delete()
    .eq("product_id", productId);
  if (delError) throw delError;

  const rows = keys.map((size) => ({
    product_id: productId,
    size,
    stock: Math.max(0, stocks[size] ?? 0),
  }));

  const { error: insError } = await supabase.from("product_size_stock").insert(rows);
  if (insError) throw insError;

  const { error: syncError } = await supabase.rpc("sync_product_total_stock", {
    p_product_id: productId,
  });
  if (syncError) throw syncError;
}
