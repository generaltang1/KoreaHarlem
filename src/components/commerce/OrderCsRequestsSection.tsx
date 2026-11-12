import { csRequestStatusLabel, csRequestTypeLabel } from "@/lib/csRequests";
import { mp } from "@/lib/mypageTheme";

export interface OrderCsRequestItem {
  id: string;
  request_type: string;
  status: string;
  reason: string;
  admin_note?: string | null;
  exchange_size?: string | null;
  item_title?: string | null;
  item_size?: string | null;
  stock_held_at?: string | null;
  stock_completed_at?: string | null;
  created_at: string;
  resolved_at?: string | null;
}

export function OrderCsRequestsSection({ requests }: { requests: OrderCsRequestItem[] }) {
  if (requests.length === 0) return null;

  return (
    <section className={`${mp.card} mt-8 p-5 text-sm text-[#f4f1ea]`}>
      <h2 className="font-semibold">CS 요청 현황</h2>
      <ul className="mt-4 space-y-3">
        {requests.map((req) => (
          <li
            key={req.id}
            className="border-t border-[rgba(244,241,234,0.12)] pt-3 first:border-0 first:pt-0"
          >
            <p className="font-medium">
              {csRequestTypeLabel(req.request_type)} ·{" "}
              <span className={mp.accent}>{csRequestStatusLabel(req.status)}</span>
            </p>
            <p className={`mt-1 text-xs ${mp.muted}`}>
              {new Date(req.created_at).toLocaleString("ko-KR")}
            </p>
            <p className="mt-2">사유: {req.reason}</p>
            {(req.item_title || req.item_size) && (
              <p className={`mt-1 ${mp.muted}`}>
                대상: {req.item_title ?? "상품"}
                {req.item_size ? ` / ${req.item_size}` : ""}
              </p>
            )}
            {req.exchange_size && (
              <p className={`mt-1 ${mp.muted}`}>희망 사이즈: {req.exchange_size}</p>
            )}
            {req.stock_held_at && !req.stock_completed_at && (
              <p className={`mt-1 text-xs ${mp.muted}`}>희망 사이즈 재고 예약(hold) 중</p>
            )}
            {req.stock_completed_at && (
              <p className={`mt-1 text-xs ${mp.muted}`}>교환 재고 처리 완료</p>
            )}
            {req.admin_note && <p className={`mt-1 ${mp.muted}`}>관리자: {req.admin_note}</p>}
            {req.resolved_at && (
              <p className={`mt-1 text-xs ${mp.muted}`}>
                처리완료: {new Date(req.resolved_at).toLocaleString("ko-KR")}
              </p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
