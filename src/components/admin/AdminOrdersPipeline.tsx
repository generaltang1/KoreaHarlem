import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/admin";
import { AdminOrderKpiCards } from "@/components/admin/AdminOrderKpiCards";
import { AdminOrdersBulkList } from "@/components/admin/AdminOrdersBulkList";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { fetchOrderKpiCounts } from "@/lib/adminDashboardData";
import type { OrderKpiKey } from "@/lib/adminOrderKpi";
import {
  ORDER_PIPELINE,
  type OrderPipelineStage,
  pipelineByStage,
} from "@/lib/adminOrders";
import { listParams, getRange, getTotalPages, parsePage, parsePageSize } from "@/lib/pagination";
import { Pagination } from "@/components/ui/Pagination";
import { ListToolbar } from "@/components/ui/ListToolbar";

type Props = {
  stage: OrderPipelineStage;
  searchParams: { page?: string; size?: string; q?: string };
};

const STAGE_TO_KPI: Partial<Record<OrderPipelineStage, OrderKpiKey>> = {
  pending: "pending",
  preparing: "preparing",
  ready: "waiting",
  shipped: "shipped",
};

export async function AdminOrdersPipeline({ stage, searchParams }: Props) {
  const config = pipelineByStage(stage);
  const page = parsePage(searchParams.page);
  const pageSize = parsePageSize(searchParams.size);
  const q = searchParams.q?.trim() ?? "";
  const { from, to } = getRange(page, pageSize);

  const admin = createServiceClient();
  if (!admin) {
    return <p className="text-sm text-rose-600">SUPABASE_SERVICE_ROLE_KEY가 필요합니다.</p>;
  }

  let query = admin
    .from("orders")
    .select(
      "id, order_number, status, customer_name, customer_email, total, currency, created_at, admin_memo, tracking_courier, tracking_number",
      { count: "exact" },
    )
    .order("created_at", { ascending: false });

  if (config.statuses?.length === 1) {
    query = query.eq("status", config.statuses[0]);
  } else if (config.statuses && config.statuses.length > 1) {
    query = query.in("status", config.statuses);
  }

  if (q) {
    query = query.or(
      `order_number.ilike.%${q}%,customer_name.ilike.%${q}%,customer_email.ilike.%${q}%`,
    );
  }

  const [{ data: orders, count }, kpiCounts] = await Promise.all([
    query.range(from, to),
    fetchOrderKpiCounts(admin),
  ]);
  const totalPages = getTotalPages(count ?? 0, pageSize);

  return (
    <div>
      <AdminPageHeader
        title={config.title}
        description={config.description}
        actions={
          <Link
            href="/admin/orders/claims"
            className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-xs uppercase tracking-widest"
          >
            클레임
          </Link>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {ORDER_PIPELINE.map((p) => (
          <Link
            key={p.stage}
            href={p.href}
            className={`rounded-md border px-3 py-1.5 text-[10px] uppercase tracking-widest ${
              p.stage === stage
                ? "border-neutral-900 bg-neutral-900 text-white"
                : "border-neutral-300 bg-white text-neutral-600"
            }`}
          >
            {p.title}
          </Link>
        ))}
      </div>

      <AdminOrderKpiCards counts={kpiCounts} activeKey={STAGE_TO_KPI[stage] ?? null} />

      <ListToolbar searchPlaceholder="주문번호, 이름, 이메일 검색" />
      <p className="mb-4 text-xs text-neutral-500">이 화면 {count ?? 0}건</p>
      <AdminOrdersBulkList orders={orders ?? []} />
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        basePath={config.href}
        params={listParams({ pageSize, q: q || undefined })}
      />
    </div>
  );
}
