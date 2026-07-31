import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/admin";
import { orderStatusLabel } from "@/lib/orders";
import { Pagination } from "@/components/ui/Pagination";
import { ListToolbar } from "@/components/ui/ListToolbar";
import {
  getRange,
  getTotalPages,
  listParams,
  parsePage,
  parsePageSize,
  buildPageUrl,
} from "@/lib/pagination";

interface AdminOrdersPageProps {
  searchParams: Promise<{ page?: string; size?: string; q?: string; status?: string }>;
}

export default async function AdminOrdersPage({ searchParams }: AdminOrdersPageProps) {
  const { page: pageParam, size: sizeParam, q: qParam, status: statusParam } = await searchParams;
  const page = parsePage(pageParam);
  const pageSize = parsePageSize(sizeParam);
  const q = qParam?.trim() ?? "";
  const status = statusParam?.trim() ?? "";
  const { from, to } = getRange(page, pageSize);

  const admin = createServiceClient();
  if (!admin) {
    return (
      <p className="text-sm text-rose-500">
        주문 관리를 위해 SUPABASE_SERVICE_ROLE_KEY를 설정해주세요.
      </p>
    );
  }

  let query = admin
    .from("orders")
    .select(
      "id, order_number, status, customer_name, customer_email, total, currency, created_at",
      { count: "exact" },
    )
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);
  if (q) {
    query = query.or(
      `order_number.ilike.%${q}%,customer_name.ilike.%${q}%,customer_email.ilike.%${q}%`,
    );
  }

  const { data: orders, count } = await query.range(from, to);
  const totalPages = getTotalPages(count ?? 0, pageSize);

  return (
    <div>
      <ListToolbar searchPlaceholder="주문번호, 이름, 이메일 검색" />
      <div className="mb-8">
        <p className="text-[10px] uppercase tracking-widest text-muted">Admin</p>
        <h1 className="mt-1 text-xl font-medium uppercase tracking-wider">주문 관리</h1>
        <p className="mt-2 text-xs text-muted">총 {count ?? 0}건</p>
      </div>

      <div className="mb-4 flex flex-wrap gap-2 text-xs">
        {[
          { label: "전체", value: "" },
          { label: "결제대기", value: "pending" },
          { label: "결제완료", value: "paid" },
          { label: "배송준비중", value: "preparing" },
          { label: "배송중", value: "shipped" },
          { label: "배송완료", value: "delivered" },
          { label: "환불", value: "refunded" },
          { label: "취소", value: "cancelled" },
        ].map((f) => (
          <Link
            key={f.value || "all"}
            href={buildPageUrl(
              "/admin/orders",
              1,
              listParams({ pageSize, q, status: f.value || undefined }),
            )}
            className={`border px-3 py-1.5 uppercase tracking-widest ${
              status === f.value ? "border-foreground" : "border-border text-muted"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <div className="space-y-2">
        {(orders ?? []).length === 0 ? (
          <p className="border border-border p-8 text-center text-sm text-muted">주문이 없습니다.</p>
        ) : (
          (orders ?? []).map((order) => (
            <Link
              key={order.id}
              href={`/admin/orders/${order.id}`}
              className="flex flex-col gap-2 border border-border p-4 transition-colors hover:border-foreground sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-sm font-medium">{order.order_number ?? order.id.slice(0, 8)}</p>
                <p className="text-xs text-muted">
                  {order.customer_name} · {order.customer_email}
                </p>
              </div>
              <div className="text-right text-sm">
                <p>{orderStatusLabel(order.status)}</p>
                <p className="text-xs text-muted">
                  {order.total?.toLocaleString()} {order.currency}
                </p>
              </div>
            </Link>
          ))
        )}
      </div>

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        basePath="/admin/orders"
        params={listParams({ pageSize, q, status: status || undefined })}
      />
    </div>
  );
}
