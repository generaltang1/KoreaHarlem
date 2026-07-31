import Link from "next/link";
import { redirect } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Pagination } from "@/components/ui/Pagination";
import { createClient } from "@/lib/supabase/server";
import {
  MEMBER_ORDER_STATUS_FILTERS,
  orderStatusLabel,
  paymentMethodLabel,
  statusesForFilter,
} from "@/lib/orders";
import { formatMinorAmount, getCurrency } from "@/lib/currency";
import {
  getRange,
  getTotalPages,
  listParams,
  parsePage,
  parsePageSize,
  buildPageUrl,
} from "@/lib/pagination";

interface MyOrdersPageProps {
  searchParams: Promise<{ page?: string; size?: string; status?: string }>;
}

export default async function MyOrdersPage({ searchParams }: MyOrdersPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/mypage/orders");
  }

  const { page: pageParam, size: sizeParam, status: statusParam } = await searchParams;
  const page = parsePage(pageParam);
  const pageSize = parsePageSize(sizeParam);
  const status = statusParam?.trim() ?? "";
  const { from, to } = getRange(page, pageSize);

  let query = supabase
    .from("orders")
    .select(
      "id, order_number, status, total, currency, payment_method, created_at, order_items(title, quantity)",
      { count: "exact" },
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const statusValues = statusesForFilter(status);
  if (statusValues?.length === 1) {
    query = query.eq("status", statusValues[0]);
  } else if (statusValues && statusValues.length > 1) {
    query = query.in("status", statusValues);
  }

  const { data: orders, count } = await query.range(from, to);
  const totalPages = getTotalPages(count ?? 0, pageSize);

  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-12 pb-24 md:px-6">
        <div className="mb-8">
          <Link href="/mypage" className="text-[10px] uppercase tracking-widest text-muted underline">
            ← My Page
          </Link>
          <h1 className="mt-2 text-xl font-medium uppercase tracking-wider">주문내역</h1>
          <p className="mt-2 text-xs text-muted">총 {count ?? 0}건</p>
        </div>

        <div className="mb-6 flex flex-wrap gap-2 text-xs">
          {MEMBER_ORDER_STATUS_FILTERS.map((f) => (
            <Link
              key={f.value || "all"}
              href={buildPageUrl(
                "/mypage/orders",
                1,
                listParams({ pageSize, status: f.value || undefined }),
              )}
              className={`border px-3 py-1.5 tracking-widest ${
                status === f.value ? "border-foreground text-foreground" : "border-border text-muted"
              }`}
            >
              {f.label}
            </Link>
          ))}
        </div>

        <div className="space-y-2">
          {(orders ?? []).length === 0 ? (
            <div className="border border-border p-10 text-center">
              <p className="text-sm text-muted">주문 내역이 없습니다.</p>
              <Link href="/sale" className="mt-4 inline-block text-xs uppercase tracking-widest underline">
                쇼핑하러 가기
              </Link>
            </div>
          ) : (
            (orders ?? []).map((order) => {
              const items = (order.order_items ?? []) as { title: string; quantity: number }[];
              const firstTitle = items[0]?.title;
              const extra = items.length > 1 ? ` 외 ${items.length - 1}건` : "";
              const summary = firstTitle ? `${firstTitle}${extra}` : "주문 상품";
              const currency = getCurrency(order.currency ?? "KRW");

              return (
                <Link
                  key={order.id}
                  href={`/mypage/orders/${order.id}`}
                  className="block border border-border p-4 transition-colors hover:border-foreground"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-widest text-muted">
                        {order.order_number ?? order.id.slice(0, 8)}
                      </p>
                      <p className="mt-1 truncate text-sm font-medium">{summary}</p>
                      <p className="mt-1 text-xs text-muted">
                        {new Date(order.created_at).toLocaleString("ko-KR")}
                        {order.payment_method
                          ? ` · ${paymentMethodLabel(order.payment_method)}`
                          : ""}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-medium">{orderStatusLabel(order.status)}</p>
                      <p className="mt-1 text-xs">
                        {formatMinorAmount(order.total ?? 0, currency)} {order.currency}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>

        <Pagination
          currentPage={page}
          totalPages={totalPages}
          basePath="/mypage/orders"
          params={listParams({ pageSize, status: status || undefined })}
        />
      </main>
      <Footer />
    </>
  );
}
