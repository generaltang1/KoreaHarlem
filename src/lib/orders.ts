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
    case "preparing":
      return "배송준비중";
    case "cancelled":
      return "취소";
    case "refunded":
      return "환불완료";
    case "shipped":
      return "배송중";
    case "delivered":
      return "배송완료";
    case "return_requested":
      return "반품요청";
    case "return_received":
      return "반품회수";
    case "return_completed":
    case "returned":
      return "반품완료";
    case "exchange_requested":
      return "교환요청";
    case "exchange_completed":
      return "교환완료";
    case "refund_requested":
      return "환불요청";
    default:
      return status;
  }
}

export const REFUNDABLE_STATUSES = ["paid", "shipped", "delivered", "preparing"] as const;
export const CANCELLABLE_PENDING_STATUSES = ["pending"] as const;

/** 배송 전 결제완료 취소 허용 (Cafe24형: 출고 전) */
export const CANCELLABLE_PAID_STATUSES = ["paid", "preparing"] as const;

export function isMemberCancellableStatus(status: string): boolean {
  return (
    (CANCELLABLE_PENDING_STATUSES as readonly string[]).includes(status) ||
    (CANCELLABLE_PAID_STATUSES as readonly string[]).includes(status)
  );
}

/** 관리자 배송 상태 전환 허용 여부 */
export function canTransitionShipping(from: string, to: string): boolean {
  const allowed: Record<string, string[]> = {
    paid: ["preparing", "shipped"],
    preparing: ["shipped"],
    shipped: ["delivered"],
  };
  return (allowed[from] ?? []).includes(to);
}

export const SHIPPING_COURIERS = [
  "CJ대한통운",
  "한진택배",
  "롯데택배",
  "로젠택배",
  "우체국택배",
  "대신택배",
  "경동택배",
  "일양로지스",
  "기타",
] as const;

export const MEMBER_ORDER_STATUS_FILTERS: { label: string; value: string }[] = [
  { label: "전체", value: "" },
  { label: "결제대기", value: "pending" },
  { label: "결제완료", value: "paid" },
  { label: "배송준비중", value: "preparing" },
  { label: "배송중", value: "shipped" },
  { label: "배송완료", value: "delivered" },
  { label: "취소", value: "cancelled" },
  { label: "환불", value: "refunded" },
  { label: "반품", value: "return" },
  { label: "교환", value: "exchange" },
];

/** 필터 탭 value → DB status 값들 */
export function statusesForFilter(filter: string): string[] | null {
  if (!filter) return null;
  if (filter === "return") {
    return ["return_requested", "return_received", "return_completed", "returned"];
  }
  if (filter === "exchange") {
    return ["exchange_requested", "exchange_completed"];
  }
  return [filter];
}
