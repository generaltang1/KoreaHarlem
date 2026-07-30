import type { SupabaseClient } from "@supabase/supabase-js";

/** YYYYMMDD-0000001 — Postgres RPC allocate_order_number() */
export async function allocateOrderNumber(supabase: SupabaseClient): Promise<string | null> {
  const { data, error } = await supabase.rpc("allocate_order_number");
  if (error || !data) return null;
  return String(data);
}

export function paymentMethodLabel(method: string | null | undefined): string {
  switch (method) {
    case "domestic_card":
      return "국내 카드";
    case "intl_card":
      return "해외 카드";
    case "paypal":
      return "PayPal";
    default:
      return method ?? "-";
  }
}

export function orderStatusLabel(status: string): string {
  switch (status) {
    case "paid":
      return "결제완료";
    case "pending":
      return "결제대기";
    case "cancelled":
      return "취소";
    case "refunded":
      return "환불완료";
    case "shipped":
      return "배송중";
    case "delivered":
      return "배송완료";
    default:
      return status;
  }
}

export const REFUNDABLE_STATUSES = ["paid", "shipped", "delivered"] as const;
export const CANCELLABLE_PENDING_STATUSES = ["pending"] as const;
