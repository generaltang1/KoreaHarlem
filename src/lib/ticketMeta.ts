export type TicketLineupItem = {
  time_label: string;
  role?: string;
  artist_name: string;
  /** 아티스트명이 있을 때만 공개면에 표시 */
  image_url?: string;
};

export type TicketPackage = {
  id: string;
  name: string;
  price_krw: number;
  description?: string;
};

export function newTicketPackageId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `pkg_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function parseTicketLineup(value: unknown): TicketLineupItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((row) => {
      if (!row || typeof row !== "object") return null;
      const r = row as Record<string, unknown>;
      const time_label = String(r.time_label ?? "").trim();
      const artist_name = String(r.artist_name ?? "").trim();
      if (!time_label && !artist_name) return null;
      const role = String(r.role ?? "").trim();
      const image_url = String(r.image_url ?? "").trim();
      return {
        time_label,
        artist_name,
        ...(role ? { role } : {}),
        ...(image_url ? { image_url } : {}),
      };
    })
    .filter((x): x is TicketLineupItem => Boolean(x));
}

export function parseTicketPackages(value: unknown): TicketPackage[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((row) => {
      if (!row || typeof row !== "object") return null;
      const r = row as Record<string, unknown>;
      const name = String(r.name ?? "").trim();
      const price_krw = Number(r.price_krw);
      if (!name || !Number.isFinite(price_krw) || price_krw < 0) return null;
      const id =
        typeof r.id === "string" && r.id.trim()
          ? r.id.trim()
          : newTicketPackageId();
      const description = String(r.description ?? "").trim();
      return {
        id,
        name,
        price_krw: Math.round(price_krw),
        ...(description ? { description } : {}),
      };
    })
    .filter((x): x is TicketPackage => Boolean(x));
}

/** B-08 시안 취소·환불 표 (멜론 언급·확인필요 괄호 없음) */
export const TICKET_CANCEL_REFUND_ROWS: { when: string; fee: string }[] = [
  {
    when: "예매 후 7일 이내 (관람일 10일 전까지)",
    fee: "없음",
  },
  {
    when: "관람일 10일 전까지",
    fee: "장당 4,000원 (티켓 금액의 10% 한도)",
  },
  {
    when: "관람일 9~7일 전",
    fee: "티켓 금액의 10%",
  },
  {
    when: "관람일 6~3일 전",
    fee: "티켓 금액의 20%",
  },
  {
    when: "관람일 2~1일 전",
    fee: "티켓 금액의 30%",
  },
  {
    when: "관람일 당일",
    fee: "취소·환불 불가",
  },
];
