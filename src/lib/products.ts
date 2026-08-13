import type { SizeStockMap } from "@/lib/stock";
import { isSoldOutFromStocks } from "@/lib/stock";

import type { ProductMerchSubcategory, ProductStoreCategory } from "@/lib/productCategories";

export interface DbProduct {
  id: string;
  title: string;
  description?: string | null;
  price_krw: number;
  compare_at_price_krw?: number | null;
  stock: number;
  sizes: string[];
  category: ProductStoreCategory;
  subcategory?: ProductMerchSubcategory | null;
  is_sale: boolean;
  is_published: boolean;
  shipping_fee_krw?: number;
  free_shipping_threshold_krw?: number | null;
  overseas_shipping?: boolean;
  size_guide?: { rows: string[][] } | null;
  created_at: string;
}

export interface DbProductImage {
  id: string;
  product_id: string;
  url: string;
  sort_order: number;
}

export interface ProductWithImages extends DbProduct {
  product_images: DbProductImage[];
  sizeStocks?: SizeStockMap;
}

export function getProductImages(product: ProductWithImages): string[] {
  return [...(product.product_images ?? [])]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((img) => img.url);
}

export function isSoldOut(
  product: Pick<DbProduct, "stock" | "sizes"> & { sizeStocks?: SizeStockMap },
): boolean {
  if (product.sizeStocks && Object.keys(product.sizeStocks).length > 0) {
    return isSoldOutFromStocks(product.sizeStocks, product.sizes ?? []);
  }
  return product.stock <= 0;
}
