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
            className={`rounded-xl border px-4 py-4 transition ${
              active
                ? "border-[#FEE500] bg-[#FEE500]/10 text-[#F4F1EA]"
                : "border-[#262626] bg-[#151515] text-[#F4F1EA] hover:border-[#3d3d3d]"
            }`}
          >
            <p
              className={`text-[10px] uppercase tracking-widest ${
                active ? "text-[#FEE500]" : "text-[#6e6b65]"
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
