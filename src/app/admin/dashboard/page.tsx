import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/admin";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminOrderKpiCards } from "@/components/admin/AdminOrderKpiCards";
import { publishDueAlbums } from "@/lib/albumPublish";
import {
  fetchBoardStatusCounts,
  fetchDailySales,
  fetchOrderKpiCounts,
  fetchRecentAdminAuditLogs,
} from "@/lib/adminDashboardData";
import { admin } from "@/lib/adminTheme";

const SHORTCUTS = [
  { href: "/admin/artists/dashboard", label: "아티스트 대시보드" },
  { href: "/admin/dj-set", label: "DJ SET" },
  { href: "/admin/products", label: "상품" },
  { href: "/admin/magazine", label: "매거진" },
  { href: "/admin/tips", label: "제보" },
  { href: "/admin/think", label: "THINK" },
] as const;

const BOARD_ROWS: {
  key: keyof Awaited<ReturnType<typeof fetchBoardStatusCounts>>;
  todayKey: keyof Awaited<ReturnType<typeof fetchBoardStatusCounts>>;
  label: string;
}[] = [
  { key: "think_posts", todayKey: "think_posts_today", label: "THINK" },
  { key: "magazine_published", todayKey: "magazine_published_today", label: "매거진(발행)" },
  { key: "tip_reports", todayKey: "tip_reports_today", label: "제보" },
  { key: "product_reviews", todayKey: "product_reviews_today", label: "상품 후기" },
  { key: "product_qna", todayKey: "product_qna_today", label: "상품 Q&A" },
  { key: "orders", todayKey: "orders_today", label: "주문" },
];

export default async function AdminDashboardPage() {
  const adminClient = createServiceClient();

  if (!adminClient) {
    return (
      <div>
        <AdminPageHeader title="대시보드" description="SERVICE_ROLE_KEY가 필요합니다." />
      </div>
    );
  }

  await publishDueAlbums(adminClient);

  const [kpiCounts, salesSeries, board, auditLogs] = await Promise.all([
    fetchOrderKpiCounts(adminClient),
    fetchDailySales(adminClient, 7),
    fetchBoardStatusCounts(adminClient),
    fetchRecentAdminAuditLogs(adminClient, 20),
  ]);

  const maxSale = Math.max(1, ...salesSeries.map((s) => s.amount));
  const weekTotal = salesSeries.reduce((s, row) => s + row.amount, 0);

  return (
    <div>
      <AdminPageHeader
        title="대시보드"
        description="주문 KPI · 일별 매출 · 게시판 현황 · 운영 로그"
        actions={
          <Link href="/admin/orders" className={admin.btnPrimary}>
            주문
          </Link>
        }
      />

      <AdminOrderKpiCards counts={kpiCounts} />

      <div className="mb-8 grid gap-4 lg:grid-cols-2">
        <section className={admin.cardPad}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#F4F1EA]">일별 매출 (7일)</h2>
            <span className={admin.label}>합계 {weekTotal.toLocaleString("ko-KR")}원</span>
          </div>
          <div className="flex h-40 items-end gap-2">
            {salesSeries.map((row) => (
              <div key={row.day} className="flex flex-1 flex-col items-center gap-2">
                <div
                  className="w-full rounded-t bg-[#FEE500]"
                  style={{ height: `${Math.max(4, (row.amount / maxSale) * 100)}%` }}
                  title={`${row.amount.toLocaleString("ko-KR")}원`}
                />
                <span className={`text-[10px] ${admin.muted}`}>{row.day.slice(5)}</span>
              </div>
            ))}
          </div>
        </section>

        <section className={admin.cardPad}>
          <h2 className="mb-4 text-sm font-semibold text-[#F4F1EA]">게시판 현황</h2>
          <ul className="space-y-3 text-sm">
            {BOARD_ROWS.map((row) => (
              <li
                key={row.key}
                className="flex items-center justify-between border-b border-[#262626] pb-2 last:border-0 last:pb-0"
              >
                <span className={admin.muted}>{row.label}</span>
                <span className="tabular-nums">
                  <span className="font-semibold text-[#F4F1EA]">{board[row.key]}</span>
                  <span className={`ml-2 text-xs ${admin.muted}`}>오늘 {board[row.todayKey]}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold text-[#F4F1EA]">바로가기</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SHORTCUTS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`${admin.card} px-4 py-4 text-sm font-medium transition hover:border-[#3d3d3d]`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </section>

      <section className={`${admin.card} overflow-hidden`}>
        <div className="border-b border-[#262626] px-5 py-4">
          <h2 className="text-sm font-semibold text-[#F4F1EA]">최근 운영 로그</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className={admin.tableHead}>
              <tr>
                <th className="px-4 py-3">구분</th>
                <th className="px-4 py-3">내용</th>
                <th className="px-4 py-3">상태/액션</th>
                <th className="px-4 py-3">담당</th>
                <th className="px-4 py-3">일시</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map((row) => (
                <tr key={row.id} className={admin.tableRow}>
                  <td className="px-4 py-3">
                    <span className="rounded bg-[#1c1c1c] px-2 py-0.5 text-[10px] text-[#FEE500]">
                      {row.module || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3">{row.summary || "—"}</td>
                  <td className={`px-4 py-3 text-xs ${admin.muted}`}>{row.action || "—"}</td>
                  <td className={`px-4 py-3 text-xs ${admin.muted}`}>
                    <p>{row.actor_nickname || "—"}</p>
                    {row.actor_email ? (
                      <p className="text-[10px] text-[#6e6b65]">{row.actor_email}</p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-xs text-[#6e6b65]">
                    {new Date(row.created_at).toLocaleString("ko-KR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {auditLogs.length === 0 ? (
            <p className={`px-4 py-8 text-center text-sm ${admin.muted}`}>
              아직 운영 로그가 없습니다.
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
