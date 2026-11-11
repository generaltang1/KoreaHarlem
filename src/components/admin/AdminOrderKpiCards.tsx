import Link from "next/link";
import { ORDER_KPI_CARDS, type OrderKpiKey } from "@/lib/adminOrderKpi";

type Props = {
  counts: Record<OrderKpiKey, number>;
  activeKey?: OrderKpiKey | null;
};

export function AdminOrderKpiCards({ counts, activeKey }: Props) {
  return (
    <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {ORDER_KPI_CARDS.map((card) => {
        const active = activeKey === card.key;
        return (
          <Link
            key={card.key}
            href={card.href}
            className={`rounded-lg border px-4 py-4 shadow-sm transition ${
              active
                ? "border-neutral-900 bg-neutral-900 text-white"
                : "border-neutral-200 bg-white text-neutral-900 hover:border-neutral-400"
            }`}
          >
            <p
              className={`text-[10px] uppercase tracking-widest ${
                active ? "text-neutral-300" : "text-neutral-500"
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
