import type { DbProduct, DbProductImage, ProductWithImages } from "@/lib/products";
import type { SizeGuideData } from "@/lib/sizeGuide";
import type { SizeStockMap } from "@/lib/stock";

export interface ProductAddonItem {
  id: string;
  sort_order: number;
  addon: ProductWithImages;
}

export interface ProductDetail extends ProductWithImages {
  shipping_fee_krw: number;
  free_shipping_threshold_krw: number | null;
  overseas_shipping: boolean;
  size_guide: SizeGuideData | null;
  sizeStocks: SizeStockMap;
  addons: ProductAddonItem[];
}

export interface AddonSelection {
  productId: string;
  title: string;
  priceKrw: number;
  imageUrl?: string | null;
  size?: string | null;
}

export function buildCheckoutQuery(params: {
  buy: string;
  size?: string;
  qty?: number;
  addons?: AddonSelection[];
}): string {
  const sp = new URLSearchParams();
  sp.set("buy", params.buy);
  if (params.size) sp.set("size", params.size);
  if (params.qty && params.qty > 1) sp.set("qty", String(params.qty));
  if (params.addons?.length) {
    sp.set(
      "addons",
      params.addons
        .map((a) => `${a.productId}:${encodeURIComponent(a.size ?? "")}`)
        .join(","),
    );
  }
  return sp.toString();
}

export function parseAddonsParam(raw: string | null): { productId: string; size: string }[] {
  if (!raw?.trim()) return [];
  return raw.split(",").map((part) => {
    const [id, sizeEnc] = part.split(":");
    return { productId: id, size: sizeEnc ? decodeURIComponent(sizeEnc) : "" };
  });
}

export type { DbProduct, DbProductImage };
