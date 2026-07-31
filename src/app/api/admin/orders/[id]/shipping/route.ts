import { NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/adminApi";
import { canTransitionShipping, orderStatusLabel } from "@/lib/orders";
import { createServiceClient } from "@/lib/supabase/admin";

type RouteContext = { params: Promise<{ id: string }> };

type ShippingAction = "preparing" | "shipped" | "delivered" | "update_tracking";

/** 관리자 배송 상태 / 송장 처리 */
export async function POST(request: Request, context: RouteContext) {
  const auth = await assertAdminApi();
  if (auth.error) return auth.error;

  const { id } = await context.params;
  const body = (await request.json()) as {
    action?: ShippingAction;
    trackingCourier?: string;
    trackingNumber?: string;
  };

  const action = body.action;
  if (!action) {
    return NextResponse.json({ message: "action이 필요합니다." }, { status: 400 });
  }

  const admin = createServiceClient();
  if (!admin) {
    return NextResponse.json({ message: "SUPABASE_SERVICE_ROLE_KEY가 필요합니다." }, { status: 503 });
  }

  const { data: order } = await admin
    .from("orders")
    .select("id, status, order_number, tracking_courier, tracking_number")
    .eq("id", id)
    .maybeSingle();

  if (!order) {
    return NextResponse.json({ message: "주문을 찾을 수 없습니다." }, { status: 404 });
  }

  const now = new Date().toISOString();
  const courier = body.trackingCourier?.trim() || order.tracking_courier || null;
  const trackingNumber = body.trackingNumber?.trim() || order.tracking_number || null;

  if (action === "update_tracking") {
    if (!["preparing", "shipped", "delivered", "paid"].includes(order.status)) {
      return NextResponse.json({ message: "현재 상태에서는 송장을 수정할 수 없습니다." }, { status: 400 });
    }
    const { error } = await admin
      .from("orders")
      .update({
        tracking_courier: courier,
        tracking_number: trackingNumber,
      })
      .eq("id", id);
    if (error) {
      return NextResponse.json(
        { message: error.message.includes("tracking_") ? "add_order_shipping.sql을 실행해주세요." : error.message },
        { status: 500 },
      );
    }
    return NextResponse.json({ ok: true, status: order.status });
  }

  if (action === "preparing") {
    if (!canTransitionShipping(order.status, "preparing")) {
      return NextResponse.json(
        { message: `${orderStatusLabel(order.status)}에서는 배송준비중으로 변경할 수 없습니다.` },
        { status: 400 },
      );
    }
    const { error } = await admin
      .from("orders")
      .update({
        status: "preparing",
        prepared_at: now,
        tracking_courier: courier,
        tracking_number: trackingNumber,
      })
      .eq("id", id);
    if (error) {
      return NextResponse.json(
        { message: error.message.includes("prepared_at") || error.message.includes("tracking_")
          ? "supabase/add_order_shipping.sql을 실행해주세요."
          : error.message },
        { status: 500 },
      );
    }
    return NextResponse.json({ ok: true, status: "preparing", statusLabel: orderStatusLabel("preparing") });
  }

  if (action === "shipped") {
    if (!canTransitionShipping(order.status, "shipped")) {
      return NextResponse.json(
        { message: `${orderStatusLabel(order.status)}에서는 배송중으로 변경할 수 없습니다.` },
        { status: 400 },
      );
    }
    const number = body.trackingNumber?.trim();
    if (!number) {
      return NextResponse.json({ message: "송장번호를 입력해주세요." }, { status: 400 });
    }
    const shipCourier = body.trackingCourier?.trim();
    if (!shipCourier) {
      return NextResponse.json({ message: "택배사를 선택해주세요." }, { status: 400 });
    }
    const { error } = await admin
      .from("orders")
      .update({
        status: "shipped",
        shipped_at: now,
        tracking_courier: shipCourier,
        tracking_number: number,
        ...(order.status === "paid" ? { prepared_at: now } : {}),
      })
      .eq("id", id);
    if (error) {
      return NextResponse.json(
        { message: error.message.includes("shipped_at") || error.message.includes("tracking_")
          ? "supabase/add_order_shipping.sql을 실행해주세요."
          : error.message },
        { status: 500 },
      );
    }
    return NextResponse.json({ ok: true, status: "shipped", statusLabel: orderStatusLabel("shipped") });
  }

  if (action === "delivered") {
    if (!canTransitionShipping(order.status, "delivered")) {
      return NextResponse.json(
        { message: `${orderStatusLabel(order.status)}에서는 배송완료로 변경할 수 없습니다.` },
        { status: 400 },
      );
    }
    const { error } = await admin
      .from("orders")
      .update({
        status: "delivered",
        delivered_at: now,
      })
      .eq("id", id);
    if (error) {
      return NextResponse.json(
        { message: error.message.includes("delivered_at")
          ? "supabase/add_order_shipping.sql을 실행해주세요."
          : error.message },
        { status: 500 },
      );
    }
    return NextResponse.json({ ok: true, status: "delivered", statusLabel: orderStatusLabel("delivered") });
  }

  return NextResponse.json({ message: "알 수 없는 action입니다." }, { status: 400 });
}
