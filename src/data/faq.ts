export type FaqCategory =
  | "배송"
  | "교환 · 반품"
  | "티켓"
  | "음원"
  | "계정";

export interface FaqItem {
  id: string;
  category: FaqCategory;
  question: string;
  answer: string;
}

export const FAQ_TABS = [
  "전체",
  "배송",
  "교환 · 반품",
  "티켓",
  "음원",
  "계정",
] as const;

export const FAQ_ITEMS: FaqItem[] = [
  {
    id: "ship-1",
    category: "배송",
    question: "언제 출고되나요?",
    answer: "매일 오후 3시에 우체국택배로 출고돼요.",
  },
  {
    id: "ship-2",
    category: "배송",
    question: "배송비는 얼마예요?",
    answer:
      "기본 배송비는 주문 금액·지역에 따라 달라질 수 있어요. 자세한 기준은 이용안내(배송)에서 확인해 주세요.",
  },
  {
    id: "ex-1",
    category: "교환 · 반품",
    question: "교환 · 반품은 어떻게 하나요?",
    answer:
      "상품을 받은 날부터 7일 이내에 고객센터 또는 마이페이지 주문 상세에서 교환·반품을 신청해 주세요. 단순 변심의 경우 왕복 배송비가 발생할 수 있습니다.",
  },
  {
    id: "ex-2",
    category: "교환 · 반품",
    question: "환불은 언제 되나요?",
    answer:
      "반품 상품이 입고·검수 완료된 뒤 결제 수단에 따라 환불이 진행됩니다. 카드사 정책에 따라 영업일 기준 3~7일 정도 소요될 수 있어요.",
  },
  {
    id: "ticket-1",
    category: "티켓",
    question: "티켓 취소 · 환불 기준은요?",
    answer:
      "티켓 환불 규정은 행사·판매처 정책에 따릅니다. 상세 기준은 상품 상세 페이지와 고객센터 안내를 확인해 주세요.",
  },
  {
    id: "music-1",
    category: "음원",
    question: "음원을 사면 뭐가 달라요?",
    answer:
      "디지털 음원을 구매하면 마이페이지 My Music에서 고음질로 다시 들을 수 있고, 구매 이력이 계정에 남아요. 미리듣기는 제한될 수 있습니다.",
  },
  {
    id: "account-1",
    category: "계정",
    question: "비회원도 주문할 수 있나요?",
    answer:
      "네. 비회원으로도 주문이 가능하며, 주문 시 입력한 정보로 비회원 주문 조회에서 배송·결제 상태를 확인할 수 있어요.",
  },
];
