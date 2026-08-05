import { NextResponse } from "next/server";
import {
  canRequestCs,
  orderStatusForCsRequest,
  OPEN_CS_STATUSES,
  type CsRequestType,
} from "@/lib/csRequests";
import { normalizeSize } from "@/lib/stock";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";

type RouteContext = { params: Promise<{ id: string }> };

/** 회원: 반품/교환/환불 요청 등록 */
export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as {
      type?: CsRequestType;
      reason?: string;
      exchangeSize?: string;
      orderItemId?: string;
    };

    const type = body.type;
    const reason = body.reason?.trim();
    if (!type || !["return", "exchange", "refund"].includes(type)) {
      return NextResponse.json({ message: "요청 유형이 올바르지 않습니다." }, { status: 400 });
    }
    if (!reason) {
      return NextResponse.json({ message: "사유를 입력해주세요." }, { status: 400 });
    }
    if (type === "exchange" && !body.exchangeSize?.trim()) {
      return NextResponse.json({ message: "교환 희망 사이즈를 입력해주세요." }, { status: 400 });
    }
    if (type === "exchange" && !body.orderItemId) {
      return NextResponse.json({ message: "교환할 주문 상품을 선택해주세요." }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
    }

    const admin = createServiceClient();
    if (!admin) {
      return NextResponse.json({ message: "SUPABASE_SERVICE_ROLE_KEY가 필요합니다." }, { status: 503 });
    }

    const { data: order } = await admin
      .from("orders")
      .select("id, user_id, status, order_number")
      .eq("id", id)
      .maybeSingle();

    if (!order || order.user_id !== user.id) {
      return NextResponse.json({ message: "주문을 찾을 수 없습니다." }, { status: 404 });
    }

    if (!canRequestCs(order.status)) {
      return NextResponse.json(
        { message: "배송중·배송완료 주문만 반품/교환/환불을 요청할 수 있습니다." },
        { status: 400 },
      );
    }

    const { data: openReq } = await admin
      .from("order_cs_requests")
      .select("id")
      .eq("order_id", id)
      .in("status", OPEN_CS_STATUSES)
      .maybeSingle();

    if (openReq) {
      return NextResponse.json(
        { message: "이미 처리 중인 CS 요청이 있습니다." },
        { status: 409 },
      );
    }

    let orderItemId: string | null = null;
    if (type === "exchange") {
      const { data: orderItem } = await admin
        .from("order_items")
        .select("id, order_id, product_id, size")
        .eq("id", body.orderItemId as string)
        .maybeSingle();

      if (!orderItem || orderItem.order_id !== id) {
        return NextResponse.json({ message: "선택한 주문 상품을 찾을 수 없습니다." }, { status: 404 });
      }
      if (!orderItem.product_id) {
        return NextResponse.json(
          { message: "상품 정보가 없는 주문 항목은 교환할 수 없습니다." },
          { status: 400 },
        );
      }
      if (normalizeSize(orderItem.size) === normalizeSize(body.exchangeSize)) {
        return NextResponse.json(
          { message: "교환 희망 사이즈가 기존 사이즈와 같습니다." },
          { status: 400 },
        );
      }
      orderItemId = orderItem.id;
    }

    const previousStatus = order.status;
    const nextOrderStatus = orderStatusForCsRequest(type);

    const { data: csReq, error: insertError } = await admin
      .from("order_cs_requests")
      .insert({
        order_id: id,
        user_id: user.id,
        request_type: type,
        status: "requested",
        reason,
        exchange_size: type === "exchange" ? body.exchangeSize?.trim() : null,
        previous_status: previousStatus,
        ...(orderItemId ? { order_item_id: orderItemId } : {}),
      })
      .select("id, request_type, status, reason, exchange_size, created_at")
      .single();

    if (insertError || !csReq) {
      return NextResponse.json(
        {
          message: insertError?.message?.includes("order_cs_requests")
            ? "supabase/add_order_cs_requests.sql을 실행해주세요."
            : insertError?.message?.includes("order_item_id")
              ? "supabase/add_exchange_stock_hold.sql을 실행해주세요."
              : insertError?.message || "요청 등록 실패",
        },
        { status: 500 },
      );
    }

    await admin.from("orders").update({ status: nextOrderStatus }).eq("id", id);
    await admin.from("order_status_histories").insert({
      order_id: id,
      from_status: previousStatus,
      to_status: nextOrderStatus,
      changed_by: user.id,
      reason: `${type} 요청: ${reason}`,
    });

    return NextResponse.json({
      ok: true,
      request: csReq,
      orderStatus: nextOrderStatus,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "서버 오류" },
      { status: 500 },
    );
  }
}
