import type { SupabaseClient } from "@supabase/supabase-js";
import {
  canRequestCs,
  orderStatusForCsRequest,
  OPEN_CS_STATUSES,
  type CsRequestType,
} from "@/lib/csRequests";
import { normalizeSize } from "@/lib/stock";

export interface CreateCsRequestInput {
  orderId: string;
  type: CsRequestType;
  reason: string;
  exchangeSize?: string;
  orderItemId?: string;
  /** 회원 요청이면 user.id, 비회원이면 null */
  actorUserId: string | null;
}

export type CreateCsRequestResult =
  | {
      ok: true;
      request: {
        id: string;
        request_type: string;
        status: string;
        reason: string;
        exchange_size: string | null;
        created_at: string;
      };
      orderStatus: string;
    }
  | { ok: false; status: number; message: string };

/** service-role 클라이언트로 CS 요청 생성 (회원·비회원 공용) */
export async function createOrderCsRequest(
  admin: SupabaseClient,
  input: CreateCsRequestInput,
): Promise<CreateCsRequestResult> {
  const { orderId, type, reason, exchangeSize, orderItemId: rawOrderItemId, actorUserId } =
    input;

  const { data: order } = await admin
    .from("orders")
    .select("id, status, order_number")
    .eq("id", orderId)
    .maybeSingle();

  if (!order) {
    return { ok: false, status: 404, message: "주문을 찾을 수 없습니다." };
  }

  if (!canRequestCs(order.status)) {
    return {
      ok: false,
      status: 400,
      message: "배송중·배송완료 주문만 반품/교환/환불을 요청할 수 있습니다.",
    };
  }

  const { data: openReq } = await admin
    .from("order_cs_requests")
    .select("id")
    .eq("order_id", orderId)
    .in("status", OPEN_CS_STATUSES)
    .maybeSingle();

  if (openReq) {
    return { ok: false, status: 409, message: "이미 처리 중인 CS 요청이 있습니다." };
  }

  let orderItemId: string | null = null;
  if (type === "exchange") {
    if (!rawOrderItemId) {
      return { ok: false, status: 400, message: "교환할 주문 상품을 선택해주세요." };
    }
    if (!exchangeSize?.trim()) {
      return { ok: false, status: 400, message: "교환 희망 사이즈를 입력해주세요." };
    }

    const { data: orderItem } = await admin
      .from("order_items")
      .select("id, order_id, product_id, size")
      .eq("id", rawOrderItemId)
      .maybeSingle();

    if (!orderItem || orderItem.order_id !== orderId) {
      return { ok: false, status: 404, message: "선택한 주문 상품을 찾을 수 없습니다." };
    }
    if (!orderItem.product_id) {
      return {
        ok: false,
        status: 400,
        message: "상품 정보가 없는 주문 항목은 교환할 수 없습니다.",
      };
    }
    if (normalizeSize(orderItem.size) === normalizeSize(exchangeSize)) {
      return {
        ok: false,
        status: 400,
        message: "교환 희망 사이즈가 기존 사이즈와 같습니다.",
      };
    }
    orderItemId = orderItem.id;
  }

  const previousStatus = order.status;
  const nextOrderStatus = orderStatusForCsRequest(type);

  const { data: csReq, error: insertError } = await admin
    .from("order_cs_requests")
    .insert({
      order_id: orderId,
      user_id: actorUserId,
      request_type: type,
      status: "requested",
      reason,
      exchange_size: type === "exchange" ? exchangeSize?.trim() : null,
      previous_status: previousStatus,
      ...(orderItemId ? { order_item_id: orderItemId } : {}),
    })
    .select("id, request_type, status, reason, exchange_size, created_at")
    .single();

  if (insertError || !csReq) {
    return {
      ok: false,
      status: 500,
      message: insertError?.message?.includes("order_cs_requests")
        ? "supabase/add_order_cs_requests.sql을 실행해주세요."
        : insertError?.message?.includes("order_item_id")
          ? "supabase/add_exchange_stock_hold.sql을 실행해주세요."
          : insertError?.message || "요청 등록 실패",
    };
  }

  await admin.from("orders").update({ status: nextOrderStatus }).eq("id", orderId);
  await admin.from("order_status_histories").insert({
    order_id: orderId,
    from_status: previousStatus,
    to_status: nextOrderStatus,
    changed_by: actorUserId,
    reason: `${type} 요청: ${reason}`,
  });

  return { ok: true, request: csReq, orderStatus: nextOrderStatus };
}

export function parseCsRequestBody(body: {
  type?: CsRequestType;
  reason?: string;
  exchangeSize?: string;
  orderItemId?: string;
}): { ok: true; type: CsRequestType; reason: string; exchangeSize?: string; orderItemId?: string } | {
  ok: false;
  message: string;
} {
  const type = body.type;
  const reason = body.reason?.trim();
  if (!type || !["return", "exchange", "refund"].includes(type)) {
    return { ok: false, message: "요청 유형이 올바르지 않습니다." };
  }
  if (!reason) {
    return { ok: false, message: "사유를 입력해주세요." };
  }
  if (type === "exchange" && !body.exchangeSize?.trim()) {
    return { ok: false, message: "교환 희망 사이즈를 입력해주세요." };
  }
  if (type === "exchange" && !body.orderItemId) {
    return { ok: false, message: "교환할 주문 상품을 선택해주세요." };
  }
  return {
    ok: true,
    type,
    reason,
    exchangeSize: body.exchangeSize,
    orderItemId: body.orderItemId,
  };
}
