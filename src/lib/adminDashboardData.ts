import type { SupabaseClient } from "@supabase/supabase-js";
import {
  ORDER_KPI_CARDS,
  PREPARING_STATUSES,
  WAITING_STATUSES,
  type OrderKpiKey,
} from "@/lib/adminOrderKpi";

export async function fetchOrderKpiCounts(
  admin: SupabaseClient,
): Promise<Record<OrderKpiKey, number>> {
  const result = Object.fromEntries(ORDER_KPI_CARDS.map((c) => [c.key, 0])) as Record<
    OrderKpiKey,
    number
  >;

  const [
    { count: pending },
    { count: preparing },
    { count: waiting },
    { count: shipped },
    { count: cancelReq },
    { count: exchangeReq },
    { count: returnReq },
    { count: preRefund },
  ] = await Promise.all([
    admin.from("orders").select("id", { count: "exact", head: true }).eq("status", "pending"),
    admin
      .from("orders")
      .select("id", { count: "exact", head: true })
      .in("status", [...PREPARING_STATUSES]),
    admin
      .from("orders")
      .select("id", { count: "exact", head: true })
      .in("status", [...WAITING_STATUSES]),
    admin.from("orders").select("id", { count: "exact", head: true }).eq("status", "shipped"),
    // cancel: CS request_type에 없음 → 취소된 주문(cancelled) 건수
    admin.from("orders").select("id", { count: "exact", head: true }).eq("status", "cancelled"),
    admin
      .from("order_cs_requests")
      .select("id", { count: "exact", head: true })
      .eq("request_type", "exchange")
      .in("status", ["requested", "approved", "received"]),
    admin
      .from("order_cs_requests")
      .select("id", { count: "exact", head: true })
      .eq("request_type", "return")
      .in("status", ["requested", "approved", "received"]),
    admin
      .from("order_cs_requests")
      .select("id", { count: "exact", head: true })
      .eq("request_type", "refund")
      .in("status", ["requested", "approved", "received"]),
  ]);

  result.pending = pending ?? 0;
  result.preparing = preparing ?? 0;
  result.waiting = waiting ?? 0;
  result.shipped = shipped ?? 0;
  result.cancel_req = cancelReq ?? 0;
  result.exchange_req = exchangeReq ?? 0;
  result.return_req = returnReq ?? 0;
  result.pre_refund = preRefund ?? 0;
  return result;
}

export async function fetchDailySales(
  admin: SupabaseClient,
  days = 7,
): Promise<{ day: string; amount: number }[]> {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));

  const { data } = await admin
    .from("orders")
    .select("total, created_at, status")
    .in("status", ["paid", "preparing", "ready", "shipped", "delivered"])
    .gte("created_at", start.toISOString());

  const map = new Map<string, number>();
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    map.set(d.toISOString().slice(0, 10), 0);
  }
  for (const row of data ?? []) {
    const key = String(row.created_at).slice(0, 10);
    if (!map.has(key)) continue;
    map.set(key, (map.get(key) ?? 0) + Number(row.total ?? 0));
  }
  return [...map.entries()].map(([day, amount]) => ({ day, amount }));
}

export type BoardStatusCounts = {
  think_posts: number;
  magazine_published: number;
  tip_reports: number;
  product_reviews: number;
  product_qna: number;
  orders: number;
  think_posts_today: number;
  magazine_published_today: number;
  tip_reports_today: number;
  product_reviews_today: number;
  product_qna_today: number;
  orders_today: number;
};

export async function fetchBoardStatusCounts(
  admin: SupabaseClient,
): Promise<BoardStatusCounts> {
  const todayIso = new Date();
  todayIso.setHours(0, 0, 0, 0);
  const today = todayIso.toISOString();

  const [
    { count: think },
    { count: magazine },
    { count: tips },
    { count: reviews },
    { count: qna },
    { count: orders },
    { count: thinkToday },
    { count: magazineToday },
    { count: tipsToday },
    { count: reviewsToday },
    { count: qnaToday },
    { count: ordersToday },
  ] = await Promise.all([
    admin.from("think_posts").select("id", { count: "exact", head: true }),
    admin
      .from("magazine_posts")
      .select("id", { count: "exact", head: true })
      .eq("status", "published"),
    admin.from("tip_reports").select("id", { count: "exact", head: true }),
    admin.from("product_reviews").select("id", { count: "exact", head: true }),
    admin.from("product_qna").select("id", { count: "exact", head: true }),
    admin.from("orders").select("id", { count: "exact", head: true }),
    admin
      .from("think_posts")
      .select("id", { count: "exact", head: true })
      .gte("created_at", today),
    admin
      .from("magazine_posts")
      .select("id", { count: "exact", head: true })
      .eq("status", "published")
      .gte("published_at", today),
    admin
      .from("tip_reports")
      .select("id", { count: "exact", head: true })
      .gte("created_at", today),
    admin
      .from("product_reviews")
      .select("id", { count: "exact", head: true })
      .gte("created_at", today),
    admin
      .from("product_qna")
      .select("id", { count: "exact", head: true })
      .gte("created_at", today),
    admin.from("orders").select("id", { count: "exact", head: true }).gte("created_at", today),
  ]);

  return {
    think_posts: think ?? 0,
    magazine_published: magazine ?? 0,
    tip_reports: tips ?? 0,
    product_reviews: reviews ?? 0,
    product_qna: qna ?? 0,
    orders: orders ?? 0,
    think_posts_today: thinkToday ?? 0,
    magazine_published_today: magazineToday ?? 0,
    tip_reports_today: tipsToday ?? 0,
    product_reviews_today: reviewsToday ?? 0,
    product_qna_today: qnaToday ?? 0,
    orders_today: ordersToday ?? 0,
  };
}

export type AdminAuditLogRow = {
  id: string;
  module: string;
  action: string;
  summary: string;
  actor_nickname: string;
  actor_email: string;
  created_at: string;
};

export async function fetchRecentAdminAuditLogs(
  admin: SupabaseClient,
  limit = 20,
): Promise<AdminAuditLogRow[]> {
  const { data } = await admin
    .from("admin_audit_logs")
    .select("id, module, action, summary, actor_nickname, actor_email, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as AdminAuditLogRow[];
}
