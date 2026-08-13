import type { SupabaseClient } from "@supabase/supabase-js";
import type { ProductDetail } from "@/lib/productDetail";
import { fetchSizeStockMap } from "@/lib/productSizeStock";
import { parseSizeGuide } from "@/lib/sizeGuide";
import type { ProductWithImages } from "@/lib/products";

export async function fetchProductDetail(
  supabase: SupabaseClient,
  id: string,
): Promise<ProductDetail | null> {
  const { data, error } = await supabase
    .from("products")
    .select("*, product_images(*)")
    .eq("id", id)
    .eq("is_published", true)
    .maybeSingle();

  if (error || !data) return null;

  const { data: links } = await supabase
    .from("product_addons")
    .select("id, sort_order, addon_product_id")
    .eq("product_id", id)
    .order("sort_order");

  let addons: ProductDetail["addons"] = [];
  if (links && links.length > 0) {
    const ids = links.map((l) => l.addon_product_id);
    const { data: addonProducts } = await supabase
      .from("products")
      .select("*, product_images(*)")
      .in("id", ids)
      .eq("is_published", true)
      .eq("is_sale", true);

    const addonIds = (addonProducts ?? []).map((p) => p.id);
    const addonStockMaps = new Map<string, Awaited<ReturnType<typeof fetchSizeStockMap>>>();
    await Promise.all(
      addonIds.map(async (addonId) => {
        addonStockMaps.set(addonId, await fetchSizeStockMap(supabase, addonId));
      }),
    );

    const byId = new Map((addonProducts ?? []).map((p) => [p.id, p as ProductWithImages]));
    addons = links
      .map((link) => {
        const addon = byId.get(link.addon_product_id);
        if (!addon) return null;
        return {
          id: link.id,
          sort_order: link.sort_order,
          addon: { ...addon, sizeStocks: addonStockMaps.get(addon.id) ?? {} },
        };
      })
      .filter(Boolean) as ProductDetail["addons"];
  }

  const sizeStocks = await fetchSizeStockMap(supabase, id);

  return {
    ...(data as ProductWithImages),
    sizeStocks,
    shipping_fee_krw: data.shipping_fee_krw ?? 4000,
    free_shipping_threshold_krw: data.free_shipping_threshold_krw ?? null,
    overseas_shipping: data.overseas_shipping ?? false,
    size_guide: parseSizeGuide(data.size_guide),
    addons,
  };
}
