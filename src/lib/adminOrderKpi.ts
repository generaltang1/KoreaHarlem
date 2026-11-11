/**
 * 주문 KPI 카드 (배송보류중 제외).
 * ready = 배송준비중 (시안·운영 합의)
 * 배송대기 = paid (결제완료·출고 전)
 */
export type OrderKpiKey =
  | "pending"
  | "preparing"
  | "waiting"
  | "shipped"
  | "cancel_req"
  | "exchange_req"
  | "return_req"
  | "pre_refund";

export const ORDER_KPI_CARDS: {
  key: OrderKpiKey;
  label: string;
  href: string;
}[] = [
  { key: "pending", label: "입금전", href: "/admin/orders/pending" },
  { key: "preparing", label: "배송준비중", href: "/admin/orders/preparing" },
  { key: "waiting", label: "배송대기", href: "/admin/orders/ready" },
  { key: "shipped", label: "배송중", href: "/admin/orders/shipped" },
  { key: "cancel_req", label: "취소신청", href: "/admin/orders/claims?type=cancel" },
  { key: "exchange_req", label: "교환신청", href: "/admin/orders/claims?type=exchange" },
  { key: "return_req", label: "반품신청", href: "/admin/orders/claims?type=return" },
  { key: "pre_refund", label: "환불전", href: "/admin/orders/claims?type=refund" },
];

/** DB status → KPI preparing 카드에 포함 */
export const PREPARING_STATUSES = ["preparing", "ready"] as const;
/** 배송대기 카드 */
export const WAITING_STATUSES = ["paid"] as const;
