/** Figma H-13~H-18 주문 파이프라인 단계 */

export type OrderPipelineStage =
  | "overview"
  | "pending"
  | "preparing"
  | "ready"
  | "shipped"
  | "delivered";

export type OrderPipelineConfig = {
  stage: OrderPipelineStage;
  title: string;
  href: string;
  /** DB status 필터. null이면 전체(운영 대시보드) */
  statuses: string[] | null;
  description: string;
};

export const ORDER_PIPELINE: OrderPipelineConfig[] = [
  {
    stage: "overview",
    title: "주문 대시보드",
    href: "/admin/orders",
    statuses: null,
    description: "전체 주문 조회 · 상태별 관리로 이동",
  },
  {
    stage: "pending",
    title: "입금전 관리",
    href: "/admin/orders/pending",
    statuses: ["pending"],
    description: "결제/입금 대기 주문",
  },
  {
    stage: "preparing",
    title: "배송 준비중",
    href: "/admin/orders/preparing",
    statuses: ["preparing", "ready"],
    description: "송장 입력 · 출고 준비 (preparing / ready)",
  },
  {
    stage: "ready",
    title: "배송 대기",
    href: "/admin/orders/ready",
    statuses: ["paid"],
    description: "결제완료 · 출고 대기 (paid)",
  },
  {
    stage: "shipped",
    title: "배송 중",
    href: "/admin/orders/shipped",
    statuses: ["shipped"],
    description: "배송 추적",
  },
  {
    stage: "delivered",
    title: "배송 완료",
    href: "/admin/orders/delivered",
    statuses: ["delivered"],
    description: "완료 주문 조회",
  },
];

export function pipelineByStage(stage: OrderPipelineStage): OrderPipelineConfig {
  return ORDER_PIPELINE.find((p) => p.stage === stage) ?? ORDER_PIPELINE[0];
}
