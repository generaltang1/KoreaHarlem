import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/admin";
import { AdminKpiRow, AdminPageHeader } from "@/components/admin/AdminPageHeader";
import {
  csRequestStatusLabel,
  csRequestTypeLabel,
  OPEN_CS_STATUSES,
} from "@/lib/csRequests";
import { orderStatusLabel } from "@/lib/orders";

const TYPE_TABS = [
  { value: "", label: "전체" },
  { value: "cancel", label: "취소" },
  { value: "exchange", label: "교환" },
  { value: "return", label: "반품" },
  { value: "refund", label: "환불" },
] as const;

/** KPI 링크 `?type=` → DB request_type. cancel은 CS 테이블에 없음(표시용 탭만). */
const TYPE_TO_REQUEST: Record<string, string | null> = {
  cancel: null,
  exchange: "exchange",
  return: "return",
  refund: "refund",
};

type Props = {
  searchParams: Promise<{ type?: string }>;
};

export default async function AdminClaimsPage({ searchParams }: Props) {
  const params = await searchParams;
  const typeParam = params.type?.trim() ?? "";
  const requestType = typeParam in TYPE_TO_REQUEST ? TYPE_TO_REQUEST[typeParam] : undefined;

  const admin = createServiceClient();
  if (!admin) {
    return <p className="text-sm text-rose-600">SUPABASE_SERVICE_ROLE_KEY가 필요합니다.</p>;
  }

  let query = admin
    .from("order_cs_requests")
    .select(
      "id, order_id, request_type, status, reason, created_at, orders(order_number, status, customer_name, customer_email)",
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (requestType) {
    query = query.eq("request_type", requestType);
  } else if (typeParam === "cancel") {
    // order_cs_requests에 cancel 유형 없음 — 빈 목록
    query = query.eq("request_type", "__none__");
  }

  const { data: claims } = await query;

  const rows = claims ?? [];
  const openCount = rows.filter((c) =>
    (OPEN_CS_STATUSES as readonly string[]).includes(c.status),
  ).length;
  const returnCount = rows.filter((c) => c.request_type === "return").length;
  const exchangeCount = rows.filter((c) => c.request_type === "exchange").length;
  const refundCount = rows.filter((c) => c.request_type === "refund").length;

  return (
    <div>
      <AdminPageHeader
        title="취소 · 교환 · 반품 · 환불 관리"
        description="CS 요청 통합 목록 · 상세에서 승인·반려·처리 · ?type= 으로 필터 가능"
        actions={
          <Link
            href="/admin/orders"
            className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-xs uppercase tracking-widest"
          >
            주문 목록
          </Link>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {TYPE_TABS.map((tab) => {
          const href = tab.value ? `/admin/orders/claims?type=${tab.value}` : "/admin/orders/claims";
          const active = typeParam === tab.value;
          return (
            <Link
              key={tab.value || "all"}
              href={href}
              className={`rounded-md border px-3 py-1.5 text-[10px] uppercase tracking-widest ${
                active
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-neutral-300 bg-white text-neutral-600"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {typeParam === "cancel" ? (
        <p className="mb-4 text-xs text-neutral-500">
          취소신청은 CS 요청 테이블에 유형이 없습니다. 결제대기 취소는 주문 상세에서 처리하세요.
        </p>
      ) : null}

      <AdminKpiRow
        items={[
          { label: "전체 요청", value: rows.length },
          { label: "진행중", value: openCount },
          { label: "반품", value: returnCount },
          { label: "교환 / 환불", value: `${exchangeCount} / ${refundCount}` },
        ]}
      />

      <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-[10px] uppercase tracking-widest text-neutral-500">
            <tr>
              <th className="px-4 py-3">유형</th>
              <th className="px-4 py-3">상태</th>
              <th className="px-4 py-3">주문</th>
              <th className="px-4 py-3">고객</th>
              <th className="px-4 py-3">주문상태</th>
              <th className="px-4 py-3">접수</th>
              <th className="px-4 py-3">관리</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const order = Array.isArray(row.orders) ? row.orders[0] : row.orders;
              const orderObj = order as
                | {
                    order_number?: string;
                    status?: string;
                    customer_name?: string;
                    customer_email?: string;
                  }
                | null;
              return (
                <tr key={row.id} className="border-b border-neutral-100">
                  <td className="px-4 py-3 font-medium">
                    {csRequestTypeLabel(row.request_type)}
                  </td>
                  <td className="px-4 py-3">{csRequestStatusLabel(row.status)}</td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {orderObj?.order_number ?? row.order_id.slice(0, 8)}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <p>{orderObj?.customer_name ?? "—"}</p>
                    <p className="text-neutral-400">{orderObj?.customer_email ?? ""}</p>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {orderObj?.status ? orderStatusLabel(orderObj.status) : "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-neutral-500">
                    {new Date(row.created_at).toLocaleString("ko-KR")}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/orders/${row.order_id}`}
                      className="text-xs underline"
                    >
                      주문 상세 · CS
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {rows.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-neutral-500">CS 요청이 없습니다.</p>
        ) : null}
      </div>
    </div>
  );
}
