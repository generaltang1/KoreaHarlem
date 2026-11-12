import Link from "next/link";
import { MypageShell } from "@/components/mypage/MypageShell";
import { ClaimRequestForm } from "@/components/mypage/ClaimRequestForm";
import { GuestClaimClient } from "@/components/mypage/GuestClaimClient";
import { createClient } from "@/lib/supabase/server";
import { OPEN_CS_STATUSES } from "@/lib/csRequests";

interface ClaimPageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderClaimPage({ params }: ClaimPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <MypageShell title="교환 · 반품 신청" subtitle="비회원 주문">
        <GuestClaimClient orderId={id} />
      </MypageShell>
    );
  }

  const { data: order } = await supabase
    .from("orders")
    .select("id, order_number, status, created_at")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!order) {
    // 로그인 회원이 게스트 주문 claim URL을 연 경우
    return (
      <MypageShell title="교환 · 반품 신청">
        <GuestClaimClient orderId={id} />
      </MypageShell>
    );
  }

  const { data: items } = await supabase
    .from("order_items")
    .select("id, product_id, title, size, quantity, unit_price, currency, image_url")
    .eq("order_id", order.id);

  const { data: csRequests } = await supabase
    .from("order_cs_requests")
    .select("status")
    .eq("order_id", order.id);

  const hasOpenRequest = (csRequests ?? []).some((r) =>
    (OPEN_CS_STATUSES as readonly string[]).includes(r.status),
  );

  const backHref = `/mypage/orders/${order.id}`;

  return (
    <MypageShell
      title="교환 · 반품 신청"
      subtitle={`${order.order_number ?? id.slice(0, 8)} · ${new Date(order.created_at).toLocaleDateString("ko-KR")}`}
    >
      <Link href={backHref} className="mb-4 inline-block text-xs text-neutral-500 underline">
        ← 주문 상세
      </Link>
      <ClaimRequestForm
        orderId={order.id}
        orderNumber={order.order_number ?? order.id.slice(0, 8)}
        status={order.status}
        hasOpenRequest={hasOpenRequest}
        items={items ?? []}
        backHref={backHref}
      />
    </MypageShell>
  );
}
