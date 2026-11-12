import Link from "next/link";
import { ORDER_KPI_CARDS, type OrderKpiKey } from "@/lib/adminOrderKpi";

type Props = {
  counts: Record<OrderKpiKey, number>;
  activeKey?: OrderKpiKey | null;
};

/** 취소/교환/반품 계열 — 시안 danger 파스텔 (#fff1f2) */
const DANGER_KEYS: ReadonlySet<OrderKpiKey> = new Set([
  "cancel_req",
  "exchange_req",
  "return_req",
  "pre_refund",
]);

export function AdminOrderKpiCards({ counts, activeKey }: Props) {
  return (
    <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {ORDER_KPI_CARDS.map((card) => {
        const active = activeKey === card.key;
        const danger = DANGER_KEYS.has(card.key);
        const bg = danger ? "bg-[#fff1f2]" : "bg-[#f3f0ff]";
        const border = active
          ? "border-[#0a0a0a] ring-1 ring-[#0a0a0a]"
          : danger
            ? "border-[#fecaca] hover:border-[#fca5a5]"
            : "border-[#e8e8e8] hover:border-[#c4b5fd]";
        return (
          <Link
            key={card.key}
            href={card.href}
            className={`rounded-[12px] border px-4 py-4 text-[#0a0a0a] transition ${bg} ${border}`}
          >
            <p
              className={`text-[10px] uppercase tracking-widest ${
                danger ? "text-[#be123c]" : "text-[#737373]"
              }`}
            >
              {card.label}
            </p>
            <p className="mt-2 text-2xl font-semibold tabular-nums">{counts[card.key] ?? 0}</p>
          </Link>
        );
      })}
    </div>
  );
}
