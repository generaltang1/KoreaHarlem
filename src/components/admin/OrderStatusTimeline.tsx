import { orderStatusLabel } from "@/lib/orders";

export type OrderStatusHistoryItem = {
  id: string;
  from_status: string | null;
  to_status: string;
  reason: string | null;
  created_at: string;
};

export function OrderStatusTimeline({
  histories,
}: {
  histories: OrderStatusHistoryItem[];
}) {
  if (histories.length === 0) {
    return (
      <section className="border border-border p-5">
        <h2 className="text-sm font-medium uppercase tracking-wider">상태 이력</h2>
        <p className="mt-3 text-xs text-muted">아직 기록된 상태 변경이 없습니다.</p>
      </section>
    );
  }

  return (
    <section className="border border-border p-5">
      <h2 className="text-sm font-medium uppercase tracking-wider">상태 이력</h2>
      <ol className="mt-4 space-y-0">
        {histories.map((h, index) => (
          <li key={h.id} className="relative flex gap-4 pb-6 last:pb-0">
            <div className="flex w-4 shrink-0 flex-col items-center">
              <span className="mt-1 h-2.5 w-2.5 rounded-full bg-foreground" />
              {index < histories.length - 1 && (
                <span className="mt-1 w-px flex-1 bg-border" aria-hidden />
              )}
            </div>
            <div className="min-w-0 flex-1 text-sm">
              <p className="font-medium">
                {h.from_status ? (
                  <>
                    {orderStatusLabel(h.from_status)}
                    <span className="mx-1.5 text-muted">→</span>
                    {orderStatusLabel(h.to_status)}
                  </>
                ) : (
                  orderStatusLabel(h.to_status)
                )}
              </p>
              <p className="mt-1 text-[10px] text-muted">
                {new Date(h.created_at).toLocaleString("ko-KR")}
              </p>
              {h.reason && <p className="mt-1 text-xs text-muted">{h.reason}</p>}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
