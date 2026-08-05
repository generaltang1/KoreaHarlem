/** DB size key: empty string = 사이즈 없는 상품 */
export function normalizeSize(size: string | null | undefined): string {
  return (size ?? "").trim();
}

export type SizeStockMap = Record<string, number>;

export function rowsToSizeStockMap(
  rows: { size: string; stock: number }[] | null | undefined,
): SizeStockMap {
  const map: SizeStockMap = {};
  for (const row of rows ?? []) {
    map[normalizeSize(row.size)] = row.stock;
  }
  return map;
}

export function getStockForSize(map: SizeStockMap, size: string | null | undefined): number {
  const key = normalizeSize(size);
  if (key in map) return map[key] ?? 0;
  return map[""] ?? 0;
}

export function totalStock(map: SizeStockMap): number {
  return Object.values(map).reduce((sum, n) => sum + n, 0);
}

export function isSoldOutFromStocks(map: SizeStockMap, sizes: string[]): boolean {
  if (sizes.length === 0) return getStockForSize(map, "") <= 0;
  return !sizes.some((s) => getStockForSize(map, s) > 0);
}

export function stockErrorMessage(error: unknown): string {
  const msg = error instanceof Error ? error.message : String(error);
  if (msg.includes("INSUFFICIENT_STOCK")) {
    return "재고가 부족합니다. 수량 또는 사이즈를 확인해주세요.";
  }
  if (msg.includes("SAME_SIZE")) {
    return "교환 희망 사이즈가 기존 사이즈와 같습니다.";
  }
  if (msg.includes("ORDER_ITEM_REQUIRED") || msg.includes("ORDER_ITEM_NOT_FOUND")) {
    return "교환 대상 주문 상품 정보를 확인해주세요.";
  }
  if (msg.includes("PRODUCT_REQUIRED")) {
    return "상품 정보가 없는 주문 항목은 교환할 수 없습니다.";
  }
  if (msg.includes("ALREADY_COMPLETED")) {
    return "이미 교환 처리가 완료되었습니다.";
  }
  if (msg.includes("ALREADY_RELEASED")) {
    return "이미 재고 hold가 해제된 요청입니다.";
  }
  if (msg.includes("HOLD_REQUIRED")) {
    return "먼저 승인(재고 hold) 처리가 필요합니다.";
  }
  if (msg.includes("NOT_EXCHANGE")) {
    return "교환 요청이 아닙니다.";
  }
  if (msg.includes("CS_REQUEST_NOT_FOUND")) {
    return "CS 요청을 찾을 수 없습니다.";
  }
  if (
    msg.includes("hold_exchange_size_stock") ||
    msg.includes("release_exchange_size_stock") ||
    msg.includes("complete_exchange_stock") ||
    msg.includes("order_item_id")
  ) {
    return "supabase/add_exchange_stock_hold.sql을 실행해주세요.";
  }
  return msg || "재고 처리 중 오류가 발생했습니다.";
}

export interface StockLine {
  productId: string;
  size?: string | null;
  quantity: number;
}

/** Merge duplicate product+size lines for stock checks */
export function mergeStockLines(lines: StockLine[]): StockLine[] {
  const merged = new Map<string, StockLine>();
  for (const line of lines) {
    const key = `${line.productId}::${normalizeSize(line.size)}`;
    const existing = merged.get(key);
    if (existing) {
      existing.quantity += line.quantity;
    } else {
      merged.set(key, {
        productId: line.productId,
        size: normalizeSize(line.size),
        quantity: line.quantity,
      });
    }
  }
  return [...merged.values()];
}

export function validateLinesAgainstStock(
  lines: StockLine[],
  stockByProduct: Map<string, SizeStockMap>,
): string | null {
  for (const line of mergeStockLines(lines)) {
    const map = stockByProduct.get(line.productId);
    if (!map) return "상품 재고 정보를 찾을 수 없습니다.";
    const available = getStockForSize(map, line.size);
    if (line.quantity > available) {
      const sizeLabel = line.size ? ` (${line.size})` : "";
      return `재고가 부족합니다${sizeLabel}. 남은 수량: ${available}개`;
    }
  }
  return null;
}
