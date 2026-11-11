import { NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/adminApi";
import { writeAdminAudit } from "@/lib/adminAudit";
import { createServiceClient } from "@/lib/supabase/admin";
import { paymentMethodLabel, orderStatusLabel } from "@/lib/orders";
import { parseShippingAddress } from "@/lib/shippingAddress";

type RouteContext = { params: Promise<{ id: string }> };

const EXTENDED_CS_SELECT =
  "id, request_type, status, reason, admin_note, exchange_size, order_item_id, hold_product_id, hold_size, hold_quantity, stock_held_at, stock_released_at, stock_completed_at, created_at, resolved_at";
const BASIC_CS_SELECT =
  "id, request_type, status, reason, admin_note, exchange_size, created_at, resolved_at";

export async function GET(_request: Request, context: RouteContext) {
  const auth = await assertAdminApi();
  if (auth.error) return auth.error;

  const { id } = await context.params;
  const admin = createServiceClient();
  if (!admin) {
    return NextResponse.json({ message: "SUPABASE_SERVICE_ROLE_KEY가 필요합니다." }, { status: 503 });
  }

  const { data: order, error } = await admin
    .from("orders")
    .select(
      "id, order_number, status, currency, total, shipping_fee, subtotal, customer_name, customer_email, customer_phone, shipping_message, shipping_address, payment_method, toss_order_id, toss_payment_key, cancel_reason, cancelled_at, refunded_at, refunded_amount, tracking_courier, tracking_number, prepared_at, shipped_at, delivered_at, admin_memo, created_at",
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !order) {
    return NextResponse.json({ message: "주문을 찾을 수 없습니다." }, { status: 404 });
  }

  const { data: items } = await admin
    .from("order_items")
    .select("id, product_id, title, size, quantity, unit_price, currency, image_url")
    .eq("order_id", id);

  let csRequests: Record<string, unknown>[] | null = null;
  const { data: extendedRows, error: csError } = await admin
    .from("order_cs_requests")
    .select(EXTENDED_CS_SELECT)
    .eq("order_id", id)
    .order("created_at", { ascending: false });

  if (csError) {
    // add_exchange_stock_hold.sql이 아직 실행되지 않은 경우 기본 컬럼으로 폴백
    const { data: basicRows } = await admin
      .from("order_cs_requests")
      .select(BASIC_CS_SELECT)
      .eq("order_id", id)
      .order("created_at", { ascending: false });
    csRequests = basicRows;
  } else {
    csRequests = extendedRows;
  }
  // table may not exist until add_order_cs_requests.sql is run

  const itemsById = new Map((items ?? []).map((item) => [item.id, item]));
  const enrichedCsRequests = (csRequests ?? []).map((req) => {
    const orderItemId = req.order_item_id as string | undefined;
    const item = orderItemId ? itemsById.get(orderItemId) : undefined;
    return {
      ...req,
      item_title: item?.title ?? null,
      item_size: item?.size ?? null,
    };
  });

  const shipping = parseShippingAddress(order.shipping_address);

  const { data: statusHistories } = await admin
    .from("order_status_histories")
    .select("id, from_status, to_status, reason, created_at")
    .eq("order_id", id)
    .order("created_at", { ascending: false });

  return NextResponse.json({
    order: {
      ...order,
      statusLabel: orderStatusLabel(order.status),
      paymentMethodLabel: paymentMethodLabel(order.payment_method),
      shipping,
      items: items ?? [],
      csRequests: enrichedCsRequests,
      statusHistories: statusHistories ?? [],
    },
  });
}

/** 관리자 메모 · 택배/송장 즉시 저장 */
export async function PATCH(request: Request, context: RouteContext) {
  const auth = await assertAdminApi();
  if (auth.error) return auth.error;

  const { id } = await context.params;
  const body = (await request.json().catch(() => ({}))) as {
    admin_memo?: string | null;
    tracking_courier?: string | null;
    tracking_number?: string | null;
  };

  const admin = createServiceClient();
  if (!admin) {
    return NextResponse.json({ message: "SUPABASE_SERVICE_ROLE_KEY가 필요합니다." }, { status: 503 });
  }

  const { data: existing } = await admin
    .from("orders")
    .select("id, order_number, admin_memo, tracking_courier, tracking_number")
    .eq("id", id)
    .maybeSingle();

  if (!existing) {
    return NextResponse.json({ message: "주문을 찾을 수 없습니다." }, { status: 404 });
  }

  const patch: Record<string, string | null> = {};
  const actions: string[] = [];

  if ("admin_memo" in body) {
    patch.admin_memo = body.admin_memo ?? "";
    actions.push("admin_memo");
  }
  if ("tracking_courier" in body) {
    patch.tracking_courier = body.tracking_courier?.trim() || null;
    actions.push("tracking_courier");
  }
  if ("tracking_number" in body) {
    patch.tracking_number = body.tracking_number?.trim() || null;
    actions.push("tracking_number");
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ message: "변경할 필드가 없습니다." }, { status: 400 });
  }

  const { error } = await admin.from("orders").update(patch).eq("id", id);
  if (error) {
    return NextResponse.json(
      {
        message:
          error.message.includes("admin_memo")
            ? "supabase/add_admin_dashboard_phase2.sql을 실행해주세요."
            : error.message.includes("tracking_")
              ? "supabase/add_order_shipping.sql을 실행해주세요."
              : error.message,
      },
      { status: 500 },
    );
  }

  await writeAdminAudit({
    module: "orders",
    action: "patch",
    targetType: "order",
    targetId: id,
    summary: `주문 ${existing.order_number ?? id.slice(0, 8)} 수정: ${actions.join(", ")}`,
    meta: patch,
  });

  return NextResponse.json({ ok: true, ...patch });
}
