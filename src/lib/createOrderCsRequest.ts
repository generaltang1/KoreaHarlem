import type { SupabaseClient } from "@supabase/supabase-js";
import {
  canRequestCs,
  orderStatusForCsRequest,
  OPEN_CS_STATUSES,
  type CsRequestType,
} from "@/lib/csRequests";
import { normalizeSize } from "@/lib/stock";

export type CsReasonCode = "change_mind" | "defect" | "wrong";

export interface CreateCsRequestInput {
  orderId: string;
  type: CsRequestType;
  reason: string;
  exchangeSize?: string;
  orderItemId?: string;
  reasonCode?: CsReasonCode;
  /** 단순 변심 반품 시 고객 부담 배송비(원). 환불 시 차감 */
  returnShippingFeeKrw?: number;
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
  const {
    orderId,
    type,
    reason,
    exchangeSize,
    orderItemId: rawOrderItemId,
    reasonCode,
    returnShippingFeeKrw,
    actorUserId,
  } = input;

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

  const fee =
    type === "return" && reasonCode === "change_mind"
      ? Math.max(0, Math.floor(returnShippingFeeKrw ?? 4000))
      : 0;

  const { data: csReq, error: insertError } = await admin
    .from("order_cs_requests")
    .insert({
      order_id: orderId,
      user_id: actorUserId,
      request_type: type,
      status: "requested",
      reason,
      reason_code: reasonCode ?? null,
      return_shipping_fee_krw: fee,
      exchange_size: type === "exchange" ? exchangeSize?.trim() : null,
      previous_status: previousStatus,
      ...(orderItemId ? { order_item_id: orderItemId } : {}),
    })
    .select("id, request_type, status, reason, exchange_size, reason_code, return_shipping_fee_krw, created_at")
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
  reasonCode?: string;
  returnShippingFeeKrw?: number;
  attachments?: { name: string; mimeType: string }[];
}):
  | {
      ok: true;
      type: CsRequestType;
      reason: string;
      exchangeSize?: string;
      orderItemId?: string;
      reasonCode?: CsReasonCode;
      returnShippingFeeKrw?: number;
      attachments: { name: string; mimeType: string }[];
    }
  | { ok: false; message: string } {
  const type = body.type;
  const reason = body.reason?.trim();
  if (!type || !["return", "exchange", "refund"].includes(type)) {
    return { ok: false, message: "요청 유형이 올바르지 않습니다." };
  }
  if (!reason) {
    return { ok: false, message: "사유를 입력해주세요." };
  }
  if (type === "exchange" && !body.exchangeSize?.trim()) {
    return { ok: false, message: "교환 희망 사이즈를 선택해주세요." };
  }
  if (type === "exchange" && !body.orderItemId) {
    return { ok: false, message: "교환할 주문 상품을 선택해주세요." };
  }

  const reasonCodeRaw = body.reasonCode?.trim();
  const reasonCode =
    reasonCodeRaw === "change_mind" || reasonCodeRaw === "defect" || reasonCodeRaw === "wrong"
      ? reasonCodeRaw
      : undefined;

  if ((reasonCode === "defect" || reasonCode === "wrong") && (body.attachments?.length ?? 0) < 1) {
    return { ok: false, message: "불량·오배송은 증빙 사진을 1장 이상 첨부해 주세요." };
  }

  return {
    ok: true,
    type,
    reason,
    exchangeSize: body.exchangeSize,
    orderItemId: body.orderItemId,
    reasonCode,
    returnShippingFeeKrw: body.returnShippingFeeKrw,
    attachments: body.attachments ?? [],
  };
}

export async function createCsAttachmentUploadSlots(
  admin: SupabaseClient,
  csRequestId: string,
  attachments: { name: string; mimeType: string }[],
): Promise<
  | { ok: true; uploads: { path: string; token: string; signedUrl: string; fileName: string; mimeType: string }[] }
  | { ok: false; message: string }
> {
  const uploads: {
    path: string;
    token: string;
    signedUrl: string;
    fileName: string;
    mimeType: string;
  }[] = [];

  for (let i = 0; i < attachments.length; i++) {
    const meta = attachments[i];
    if (!meta.mimeType.startsWith("image/")) {
      return { ok: false, message: "이미지 파일만 첨부할 수 있습니다." };
    }
    const ext = meta.name.includes(".")
      ? meta.name.split(".").pop()?.toLowerCase() || "jpg"
      : "jpg";
    const path = `${csRequestId}/${crypto.randomUUID()}.${ext}`;
    const { data, error } = await admin.storage.from("cs-claims").createSignedUploadUrl(path);
    if (error || !data) {
      return {
        ok: false,
        message: error?.message?.includes("Bucket")
          ? "supabase/add_cs_claim_attachments.sql을 실행해주세요. (cs-claims 버킷)"
          : `업로드 URL 생성 실패: ${error?.message ?? "unknown"}`,
      };
    }
    uploads.push({
      path: data.path,
      token: data.token,
      signedUrl: data.signedUrl,
      fileName: meta.name,
      mimeType: meta.mimeType,
    });
  }

  return { ok: true, uploads };
}

export async function finalizeCsAttachments(
  admin: SupabaseClient,
  csRequestId: string,
  uploads: { path: string; fileName: string; mimeType: string }[],
): Promise<{ ok: true } | { ok: false; message: string }> {
  const rows = uploads.map((u, i) => {
    const { data } = admin.storage.from("cs-claims").getPublicUrl(u.path);
    return {
      cs_request_id: csRequestId,
      file_url: data.publicUrl,
      file_name: u.fileName,
      mime_type: u.mimeType,
      sort_order: i,
    };
  });
  if (rows.length === 0) return { ok: true };
  const { error } = await admin.from("order_cs_attachments").insert(rows);
  if (error) {
    return {
      ok: false,
      message: error.message.includes("order_cs_attachments")
        ? "supabase/add_cs_claim_attachments.sql을 실행해주세요."
        : error.message,
    };
  }
  return { ok: true };
}
