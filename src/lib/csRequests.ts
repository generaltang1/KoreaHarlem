export type CsRequestType = "return" | "exchange" | "refund";
export type CsRequestStatus =
  | "requested"
  | "approved"
  | "rejected"
  | "received"
  | "completed"
  | "cancelled";

export function csRequestTypeLabel(type: string): string {
  switch (type) {
    case "return":
      return "반품";
    case "exchange":
      return "교환";
    case "refund":
      return "환불";
    default:
      return type;
  }
}

export function csRequestStatusLabel(status: string): string {
  switch (status) {
    case "requested":
      return "요청접수";
    case "approved":
      return "승인";
    case "rejected":
      return "반려";
    case "received":
      return "회수/검수완료";
    case "completed":
      return "처리완료";
    case "cancelled":
      return "취소";
    default:
      return status;
  }
}

/** 배송중·배송완료에서 CS 요청 가능 */
export function canRequestCs(orderStatus: string): boolean {
  return orderStatus === "shipped" || orderStatus === "delivered";
}

export function orderStatusForCsRequest(type: CsRequestType): string {
  switch (type) {
    case "return":
      return "return_requested";
    case "exchange":
      return "exchange_requested";
    case "refund":
      return "refund_requested";
    default:
      return "return_requested";
  }
}

export const OPEN_CS_STATUSES: CsRequestStatus[] = [
  "requested",
  "approved",
  "received",
];
