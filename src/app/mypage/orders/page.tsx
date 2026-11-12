import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { MypageShell } from "@/components/mypage/MypageShell";
import { Pagination } from "@/components/ui/Pagination";
import { createClient } from "@/lib/supabase/server";
import {
  MEMBER_ORDER_STATUS_FILTERS,
  isMemberCancellableStatus,
  orderStatusLabel,
  paymentMethodLabel,
  statusesForFilter,
} from "@/lib/orders";
import { canRequestCs } from "@/lib/csRequests";
import { formatMinorAmount, getCurrency } from "@/lib/currency";
import {
  getRange,
  getTotalPages,
  listParams,
  parsePage,
  parsePageSize,
  buildPageUrl,
} from "@/lib/pagination";
import { mp } from "@/lib/mypageTheme";

interface MyOrdersPageProps {
  searchParams: Promise<{ page?: string; size?: string; status?: string }>;
}

function trackingUrl(courier: string | null, number: string | null): string | null {
  if (!number) return null;
  const n = encodeURIComponent(number);
  const c = (courier ?? "").toLowerCase();
  if (c.includes("우체국") || c.includes("post")) {
    return `https://service.epost.go.kr/trace.RetrieveDomRigiTraceList.comm?sid1=${n}`;
  }
  return `https://search.naver.com/search.naver?query=${encodeURIComponent(`${courier ?? ""} ${number}`)}`;
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
      "id, order_number, status, total, currency, payment_method, tracking_courier, tracking_number, created_at, order_items(title, quantity, size, image_url)",
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
    <MypageShell
      title="주문 내역"
      subtitle={`배송 상품과 티켓 주문을 모두 확인할 수 있습니다 · 총 ${count ?? 0}건`}
    >
      <p className={`mb-4 text-xs ${mp.muted}`}>
        배송 완료 후 7일 이내 교환·반품 신청 가능 · 단순 변심 반품 배송비 ₩4,000
      </p>

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
              status === f.value
                ? "border-[#FEE500] text-[#FEE500]"
                : "border-[#333] text-neutral-400"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <div className="space-y-3">
        {(orders ?? []).length === 0 ? (
          <div className={`${mp.card} p-10 text-center`}>
            <p className={`text-sm ${mp.muted}`}>주문 내역이 없습니다.</p>
            <Link href="/sale" className={`mt-4 ${mp.creamBtn}`}>
              쇼핑하러 가기
            </Link>
          </div>
        ) : (
          (orders ?? []).map((order) => {
            const items = (order.order_items ?? []) as {
              title: string;
              quantity: number;
              size: string | null;
              image_url: string | null;
            }[];
            const first = items[0];
            const currency = getCurrency(order.currency ?? "KRW");
            const track = trackingUrl(order.tracking_courier, order.tracking_number);

            return (
              <article key={order.id} className={`${mp.card} p-4`}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-neutral-500">
                      {order.order_number ?? order.id.slice(0, 8)}
                    </p>
                    <p className="mt-1 text-xs text-neutral-500">
                      {new Date(order.created_at).toLocaleString("ko-KR")}
                      {order.payment_method
                        ? ` · ${paymentMethodLabel(order.payment_method)}`
                        : ""}
                    </p>
                  </div>
                  <p className="text-sm font-medium text-[#FEE500]">
                    {orderStatusLabel(order.status)}
                  </p>
                </div>

                <div className="mt-3 flex gap-3">
                  <Link
                    href={`/mypage/orders/${order.id}`}
                    className="relative h-20 w-14 shrink-0 overflow-hidden bg-[#0c0c0c]"
                  >
                    {first?.image_url ? (
                      <Image src={first.image_url} alt="" fill className="object-cover" />
                    ) : null}
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/mypage/orders/${order.id}`}
                      className="block truncate text-sm font-medium hover:underline"
                    >
                      {first?.title ?? "주문 상품"}
                      {items.length > 1 ? ` 외 ${items.length - 1}건` : ""}
                    </Link>
                    <p className={`mt-1 text-xs ${mp.muted}`}>
                      {first?.size ? `사이즈 ${first.size} · ` : ""}
                      {first ? `${first.quantity}개` : ""}
                    </p>
                    <p className="mt-1 text-sm">
                      {formatMinorAmount(order.total ?? 0, currency)} {order.currency}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    href={`/mypage/orders/${order.id}`}
                    className="border border-[#333] px-3 py-1.5 text-xs hover:border-neutral-500"
                  >
                    상세
                  </Link>
                  {isMemberCancellableStatus(order.status) ? (
                    <Link
                      href={`/mypage/orders/${order.id}#cancel`}
                      className="border border-[#333] px-3 py-1.5 text-xs hover:border-neutral-500"
                    >
                      취소 신청
                    </Link>
                  ) : null}
                  {track ? (
                    <a
                      href={track}
                      target="_blank"
                      rel="noreferrer"
                      className="border border-[#333] px-3 py-1.5 text-xs hover:border-neutral-500"
                    >
                      배송 조회
                    </a>
                  ) : null}
                  {canRequestCs(order.status) ? (
                    <Link
                      href={`/mypage/orders/${order.id}/claim`}
                      className="border border-[#333] px-3 py-1.5 text-xs hover:border-neutral-500"
                    >
                      교환·반품 신청
                    </Link>
                  ) : null}
                </div>
              </article>
            );
          })
        )}
      </div>

      <div className="mt-8">
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          basePath="/mypage/orders"
          params={listParams({ pageSize, status: status || undefined })}
        />
      </div>
    </MypageShell>
  );
}
