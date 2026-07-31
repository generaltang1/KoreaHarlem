import { normalizeSize } from "@/lib/stock";

export type StockAdjustmentLog = {
  id: string;
  product_id: string;
  size: string;
  delta: number;
  stock_before: number;
  stock_after: number;
  reason: string;
  adjusted_by: string | null;
  created_at: string;
};

export function formatSizeLabel(size: string | null | undefined): string {
  const key = normalizeSize(size);
  return key || "단일 (사이즈 없음)";
}

export function formatDelta(delta: number): string {
  return delta > 0 ? `+${delta}` : String(delta);
}
