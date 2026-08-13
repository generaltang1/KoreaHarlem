import type { SupabaseClient } from "@supabase/supabase-js";

export interface ProductAvailability {
  is_published: boolean;
  is_sale: boolean;
  title?: string;
}

export function isProductPurchasable(status: ProductAvailability | undefined): boolean {
  return !!status?.is_published && !!status?.is_sale;
}

export function unavailableReason(status: ProductAvailability | undefined): string | null {
  if (!status) return "진열 종료 또는 삭제된 상품";
  if (!status.is_published) return "진열 종료";
  if (!status.is_sale) return "판매 중지";
  return null;
}

export async function fetchProductAvailability(
  supabase: SupabaseClient,
  productIds: string[],
): Promise<Map<string, ProductAvailability>> {
  const unique = [...new Set(productIds.filter(Boolean))];
  if (unique.length === 0) return new Map();

  const { data } = await supabase
    .from("products")
    .select("id, title, is_published, is_sale")
    .in("id", unique);

  const map = new Map<string, ProductAvailability>();
  for (const row of data ?? []) {
    map.set(row.id, {
      is_published: row.is_published,
      is_sale: row.is_sale,
      title: row.title,
    });
  }
  return map;
}

export function findUnavailableLines(
  lines: { productId: string; title: string }[],
  availability: Map<string, ProductAvailability>,
): { productId: string; title: string; reason: string }[] {
  const seen = new Set<string>();
  const result: { productId: string; title: string; reason: string }[] = [];

  for (const line of lines) {
    if (seen.has(line.productId)) continue;
    const status = availability.get(line.productId);
    const reason = unavailableReason(status);
    if (reason) {
      seen.add(line.productId);
      result.push({
        productId: line.productId,
        title: status?.title ?? line.title,
        reason,
      });
    }
  }

  return result;
}

export function buildUnavailableAlertMessage(
  unavailable: { title: string; reason: string }[],
): string {
  const list = unavailable.map((u) => `· ${u.title} (${u.reason})`).join("\n");
  return `구매할 수 없는 상품이 포함되어 있습니다.\n\n${list}\n\n장바구니에서 해당 상품을 제거한 후 다시 시도해주세요.`;
}
