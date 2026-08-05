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

/**
 * Cafe24형 수정 화면용: 재고 절대값은 건드리지 않고 사이즈 키만 동기화.
 * - 새로 추가된 사이즈는 재고 0으로 생성
 * - 재고가 남아있는(0보다 큰) 사이즈는 목록에서 빠지더라도 삭제하지 않음(에러)
 */
export async function syncSizeStockKeys(
  supabase: SupabaseClient,
  productId: string,
  sizes: string[],
): Promise<void> {
  const keys = sizes.length > 0 ? sizes : [""];

  const { data: existingRows, error: fetchError } = await supabase
    .from("product_size_stock")
    .select("size, stock")
    .eq("product_id", productId);
  if (fetchError) throw fetchError;

  const existingMap = new Map((existingRows ?? []).map((row) => [row.size, row.stock]));

  const toRemove = [...existingMap.keys()].filter((size) => !keys.includes(size));
  const blocked = toRemove.filter((size) => (existingMap.get(size) ?? 0) > 0);
  if (blocked.length > 0) {
    throw new Error(
      `재고가 남아있는 사이즈는 삭제할 수 없습니다: ${blocked.join(", ")} (재고를 0으로 조정 후 다시 시도해주세요)`,
    );
  }

  const removable = toRemove.filter((size) => !blocked.includes(size));
  if (removable.length > 0) {
    const { error: delError } = await supabase
      .from("product_size_stock")
      .delete()
      .eq("product_id", productId)
      .in("size", removable);
    if (delError) throw delError;
  }

  const toAdd = keys.filter((size) => !existingMap.has(size));
  if (toAdd.length > 0) {
    const { error: insError } = await supabase
      .from("product_size_stock")
      .insert(toAdd.map((size) => ({ product_id: productId, size, stock: 0 })));
    if (insError) throw insError;
  }

  const { error: syncError } = await supabase.rpc("sync_product_total_stock", {
    p_product_id: productId,
  });
  if (syncError) throw syncError;
}
