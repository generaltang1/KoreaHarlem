import { NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/adminApi";
import {
  canTransitionShipping,
  isBulkShippingStatus,
  orderStatusLabel,
  type BulkShippingStatus,
} from "@/lib/orders";
import { createServiceClient } from "@/lib/supabase/admin";

type BulkResult = {
  id: string;
  orderNumber: string | null;
  ok: boolean;
  fromStatus?: string;
  toStatus?: string;
  message?: string;
};

/** 관리자: 주문 목록 일괄 배송 상태 변경 */
export async function POST(request: Request) {
  const auth = await assertAdminApi();
  if (auth.error) return auth.error;

  const body = (await request.json()) as {
    orderIds?: string[];
    status?: string;
    trackingCourier?: string;
    trackingNumber?: string;
  };

  const orderIds = Array.isArray(body.orderIds)
    ? [...new Set(body.orderIds.filter((id) => typeof id === "string" && id.trim()))]
    : [];
  const target = body.status?.trim() ?? "";

  if (orderIds.length === 0) {
    return NextResponse.json({ message: "주문을 선택해주세요." }, { status: 400 });
  }
  if (orderIds.length > 100) {
    return NextResponse.json({ message: "한 번에 최대 100건까지 변경할 수 있습니다." }, { status: 400 });
  }
  if (!isBulkShippingStatus(target)) {
    return NextResponse.json(
      { message: "일괄 변경은 배송준비중·배송중·배송완료만 가능합니다." },
      { status: 400 },
    );
  }

  const toStatus = target as BulkShippingStatus;
  const courier = body.trackingCourier?.trim() || "";
  const trackingNumber = body.trackingNumber?.trim() || "";

  if (toStatus === "shipped" && (!courier || !trackingNumber)) {
    return NextResponse.json(
      { message: "배송중으로 일괄 변경 시 택배사와 송장번호가 필요합니다." },
      { status: 400 },
    );
  }

  const admin = createServiceClient();
  if (!admin) {
    return NextResponse.json({ message: "SUPABASE_SERVICE_ROLE_KEY가 필요합니다." }, { status: 503 });
  }

  const { data: orders, error } = await admin
    .from("orders")
    .select("id, order_number, status, tracking_courier, tracking_number")
    .in("id", orderIds);

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  const byId = new Map((orders ?? []).map((o) => [o.id, o]));
  const now = new Date().toISOString();
  const actorId = auth.user.id;
  const results: BulkResult[] = [];
  let successCount = 0;

  for (const id of orderIds) {
    const order = byId.get(id);
    if (!order) {
      results.push({ id, orderNumber: null, ok: false, message: "주문을 찾을 수 없습니다." });
      continue;
    }

    if (!canTransitionShipping(order.status, toStatus)) {
      results.push({
        id,
        orderNumber: order.order_number,
        ok: false,
        fromStatus: order.status,
        message: `${orderStatusLabel(order.status)} → ${orderStatusLabel(toStatus)} 전환 불가`,
      });
      continue;
    }

    const patch: Record<string, unknown> = { status: toStatus };
    let reason = orderStatusLabel(toStatus);

    if (toStatus === "preparing") {
      patch.prepared_at = now;
      reason = "일괄: 배송준비중";
    } else if (toStatus === "shipped") {
      patch.shipped_at = now;
      patch.tracking_courier = courier;
      patch.tracking_number = trackingNumber;
      if (order.status === "paid") patch.prepared_at = now;
      reason = `일괄: 배송중 (${courier} ${trackingNumber})`;
    } else if (toStatus === "delivered") {
      patch.delivered_at = now;
      reason = "일괄: 배송완료";
    }

    const { error: updateError } = await admin.from("orders").update(patch).eq("id", id);
    if (updateError) {
      results.push({
        id,
        orderNumber: order.order_number,
        ok: false,
        fromStatus: order.status,
        message: updateError.message.includes("prepared_at") ||
          updateError.message.includes("shipped_at") ||
          updateError.message.includes("delivered_at") ||
          updateError.message.includes("tracking_")
          ? "add_order_shipping.sql을 실행해주세요."
          : updateError.message,
      });
      continue;
    }

    await admin.from("order_status_histories").insert({
      order_id: id,
      from_status: order.status,
      to_status: toStatus,
      changed_by: actorId,
      reason,
    });

    successCount += 1;
    results.push({
      id,
      orderNumber: order.order_number,
      ok: true,
      fromStatus: order.status,
      toStatus,
    });
  }

  return NextResponse.json({
    ok: true,
    successCount,
    failCount: results.length - successCount,
    statusLabel: orderStatusLabel(toStatus),
    results,
  });
}
