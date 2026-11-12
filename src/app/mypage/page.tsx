import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { MypageShell } from "@/components/mypage/MypageShell";
import { MypageCartShortcut } from "@/components/mypage/MypageCartShortcut";
import { createClient } from "@/lib/supabase/server";
import { detectAuthProvider, authProviderLabel } from "@/lib/auth/provider";
import { isMemberCancellableStatus, orderStatusLabel } from "@/lib/orders";
import { formatMinorAmount, getCurrency } from "@/lib/currency";
import { mp } from "@/lib/mypageTheme";

export default async function MyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/mypage");

  const provider = detectAuthProvider(user);
  const { data: profile } = await supabase
    .from("profiles")
    .select("nickname")
    .eq("id", user.id)
    .maybeSingle();

  const displayName =
    profile?.nickname?.trim() ||
    (user.user_metadata?.nickname as string) ||
    (user.user_metadata?.full_name as string) ||
    (user.user_metadata?.name as string) ||
    user.email?.split("@")[0] ||
    "회원";

  const { data: orders } = await supabase
    .from("orders")
    .select(
      "id, order_number, status, total, currency, created_at, order_items(title, quantity, size, image_url, unit_price)",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const allOrders = orders ?? [];
  const countBy = (pred: (s: string) => boolean) =>
    allOrders.filter((o) => pred(o.status)).length;

  const statusChips = [
    { label: "결제 대기", count: countBy((s) => s === "pending") },
    { label: "결제 완료", count: countBy((s) => s === "paid") },
    { label: "배송 준비중", count: countBy((s) => s === "preparing" || s === "ready") },
    { label: "배송 중", count: countBy((s) => s === "shipped") },
    { label: "배송 완료", count: countBy((s) => s === "delivered") },
  ];

  const { count: cancelCount } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "cancelled");

  const orderIds = allOrders.map((o) => o.id);
  let csList: { request_type: string }[] = [];
  if (orderIds.length > 0) {
    const { data: csRows } = await supabase
      .from("order_cs_requests")
      .select("request_type")
      .in("order_id", orderIds);
    csList = csRows ?? [];
  }
  const claimChips = [
    { label: "취소", count: cancelCount ?? 0 },
    {
      label: "교환",
      count: csList.filter((r) => r.request_type === "exchange").length,
    },
    {
      label: "반품",
      count: csList.filter((r) => r.request_type === "return").length,
    },
    {
      label: "환불",
      count:
        csList.filter((r) => r.request_type === "refund").length +
        allOrders.filter((o) => o.status === "refunded").length,
    },
  ];

  const recent = allOrders.slice(0, 5);

  const { count: musicCount } = await supabase
    .from("music_entitlements")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  const { count: wishCount } = await supabase
    .from("wishlist_items")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  return (
    <MypageShell title="마이페이지">
      <section className={`${mp.card} flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between`}>
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#FEE500] text-lg font-bold text-[#191919]">
            {displayName.slice(0, 1)}
          </div>
          <div>
            <p className="text-lg font-semibold">{displayName} 님</p>
            <p className={`mt-0.5 text-xs ${mp.muted}`}>
              {user.email} · {authProviderLabel(provider)} 로그인
            </p>
          </div>
        </div>
        <Link href="/mypage/profile" className={mp.ghostBtn}>
          내 정보 변경
        </Link>
      </section>

      <section className={`${mp.card} mt-5 p-5`}>
        <h2 className="text-sm font-semibold">주문 · 배송 현황</h2>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
          {statusChips.map((chip) => (
            <Link key={chip.label} href="/mypage/orders" className={mp.chip}>
              <p className={`text-lg font-semibold ${mp.accent}`}>{chip.count}</p>
              <p className={`mt-1 text-[11px] ${mp.muted}`}>{chip.label}</p>
            </Link>
          ))}
        </div>
        <div className={`mt-3 flex flex-wrap gap-3 text-xs ${mp.tertiary}`}>
          {claimChips.map((c) => (
            <span key={c.label}>
              {c.label} <span className="text-[#f4f1ea]">{c.count}</span>
            </span>
          ))}
        </div>
      </section>

      <section className="mt-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">최근 주문</h2>
          <Link href="/mypage/orders" className="text-xs text-[#FEE500] hover:underline">
            전체 보기 →
          </Link>
        </div>
        {recent.length === 0 ? (
          <div className={`${mp.card} px-5 py-10 text-center text-sm ${mp.muted}`}>
            최근 주문이 없습니다.
          </div>
        ) : (
          <ul className="space-y-3">
            {recent.map((order) => {
              const items = (order.order_items ?? []) as {
                title: string;
                quantity: number;
                size: string | null;
                image_url: string | null;
                unit_price: number;
              }[];
              const first = items[0];
              const currency = getCurrency(order.currency ?? "KRW");
              return (
                <li key={order.id} className={`${mp.card} p-4`}>
                  <div className={`flex flex-wrap items-center justify-between gap-2 text-xs ${mp.muted}`}>
                    <span>
                      {new Date(order.created_at).toLocaleDateString("ko-KR")} ·{" "}
                      {order.order_number ?? order.id.slice(0, 8)}
                    </span>
                    <span className={mp.accent}>{orderStatusLabel(order.status)}</span>
                  </div>
                  <div className="mt-3 flex gap-3">
                    <div className={`${mp.thumb} h-16 w-12`}>
                      {first?.image_url ? (
                        <Image src={first.image_url} alt="" fill className="object-cover" />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {first?.title ?? "주문 상품"}
                        {items.length > 1 ? ` 외 ${items.length - 1}건` : ""}
                      </p>
                      <p className={`mt-1 text-xs ${mp.muted}`}>
                        {first?.size ? `사이즈 ${first.size} · ` : ""}
                        {first ? `${first.quantity}개` : ""}
                        {" · "}
                        {formatMinorAmount(order.total ?? 0, currency)}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Link href={`/mypage/orders/${order.id}`} className={mp.pill}>
                          주문 상세
                        </Link>
                        {isMemberCancellableStatus(order.status) ? (
                          <Link
                            href={`/mypage/orders/${order.id}#cancel`}
                            className={`${mp.pill} ${mp.muted}`}
                          >
                            주문 취소
                          </Link>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="mt-5 grid gap-3 sm:grid-cols-3">
        <Link
          href="/mypage/music"
          className={`${mp.card} p-5 transition-colors hover:border-[rgba(251,194,1,0.45)]`}
        >
          <p className="text-sm font-semibold">My Music</p>
          <p className={`mt-2 text-xs ${mp.muted}`}>구매 음원 {musicCount ?? 0}</p>
          <p className={`mt-3 text-xs ${mp.accent}`}>다운로드 →</p>
        </Link>
        <Link
          href="/mypage/wishlist"
          className={`${mp.card} p-5 transition-colors hover:border-[rgba(251,194,1,0.45)]`}
        >
          <p className="text-sm font-semibold">위시리스트</p>
          <p className={`mt-2 text-xs ${mp.muted}`}>찜한 상품 {wishCount ?? 0}</p>
          <p className={`mt-3 text-xs ${mp.accent}`}>보기 →</p>
        </Link>
        <MypageCartShortcut />
      </section>
    </MypageShell>
  );
}
