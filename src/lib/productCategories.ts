/** IN STORE 상품 카테고리 (Shop All은 필터 없음 = 전체) */
export type ProductStoreCategory = "merch" | "cd" | "ticket";
export type ProductMerchSubcategory = "tops" | "bottoms" | "accessory";

export const PRODUCT_CATEGORIES: {
  value: ProductStoreCategory;
  label: string;
}[] = [
  { value: "merch", label: "Merch" },
  { value: "cd", label: "CD" },
  { value: "ticket", label: "Ticket" },
];

export const MERCH_SUBCATEGORIES: {
  value: ProductMerchSubcategory;
  label: string;
}[] = [
  { value: "tops", label: "Tops" },
  { value: "bottoms", label: "Bottoms" },
  { value: "accessory", label: "Accessory" },
];

export function productCategoryLabel(category: string, subcategory?: string | null): string {
  const cat = PRODUCT_CATEGORIES.find((c) => c.value === category);
  if (category === "merch" && subcategory) {
    const sub = MERCH_SUBCATEGORIES.find((s) => s.value === subcategory);
    return sub ? `Merch · ${sub.label}` : "Merch";
  }
  return cat?.label ?? category;
}

export function salePageTitle(category?: string, sub?: string): string {
  if (!category) return "Shop All";
  if (category === "merch" && sub) {
    const subLabel = MERCH_SUBCATEGORIES.find((s) => s.value === sub)?.label;
    return subLabel ? `Merch · ${subLabel}` : "Merch";
  }
  return productCategoryLabel(category);
}

export function parseSaleCategoryFilter(category?: string, sub?: string): {
  category?: ProductStoreCategory;
  subcategory?: ProductMerchSubcategory;
} {
  if (!category || category === "all") {
    return {};
  }
  const cat = category as ProductStoreCategory;
  if (cat === "merch" && sub && MERCH_SUBCATEGORIES.some((s) => s.value === sub)) {
    return { category: cat, subcategory: sub as ProductMerchSubcategory };
  }
  return { category: cat };
}
