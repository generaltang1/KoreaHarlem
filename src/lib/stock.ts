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
