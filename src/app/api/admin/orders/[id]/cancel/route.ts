import { NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/adminApi";
import { createServiceClient } from "@/lib/supabase/admin";
import { stockErrorMessage } from "@/lib/stock";

type RouteContext = { params: Promise<{ id: string }> };

/** 결제 대기 주문 취소 (토스 환불 없음, 재고 복구) */
export async function POST(request: Request, context: RouteContext) {
  const auth = await assertAdminApi();
  if (auth.error) return auth.error;

  const { id } = await context.params;
  const body = (await request.json().catch(() => ({}))) as { reason?: string };
  const reason = body.reason?.trim() || "관리자 주문 취소";

  const admin = createServiceClient();
  if (!admin) {
    return NextResponse.json({ message: "SUPABASE_SERVICE_ROLE_KEY가 필요합니다." }, { status: 503 });
  }

  const { data: order } = await admin
    .from("orders")
    .select("id, status, order_number")
    .eq("id", id)
    .maybeSingle();

  if (!order) {
    return NextResponse.json({ message: "주문을 찾을 수 없습니다." }, { status: 404 });
  }

  if (order.status !== "pending") {
    return NextResponse.json(
      { message: "결제 대기 중인 주문만 이 방식으로 취소할 수 있습니다. 환불은 환불 처리를 이용하세요." },
      { status: 400 },
    );
  }

  const { error: releaseError } = await admin.rpc("release_stock_for_order", {
    p_order_id: id,
  });

  if (releaseError) {
    return NextResponse.json({ message: stockErrorMessage(releaseError) }, { status: 500 });
  }

  await admin
    .from("orders")
    .update({
      cancel_reason: reason,
      cancelled_at: new Date().toISOString(),
    })
    .eq("id", id);

  return NextResponse.json({
    ok: true,
    orderNumber: order.order_number,
    status: "cancelled",
  });
}
