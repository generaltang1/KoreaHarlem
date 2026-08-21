import { NextResponse } from "next/server";
import type { CsRequestType } from "@/lib/csRequests";
import { createOrderCsRequest, parseCsRequestBody } from "@/lib/createOrderCsRequest";
import { verifyGuestPassword } from "@/lib/guestPassword";
import { createServiceClient } from "@/lib/supabase/admin";

type RouteContext = { params: Promise<{ id: string }> };

/** 비회원: 주문조회 비밀번호로 반품/교환/환불 요청 등록 */
export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as {
      password?: string;
      type?: CsRequestType;
      reason?: string;
      exchangeSize?: string;
      orderItemId?: string;
    };

    if (!body.password) {
      return NextResponse.json({ message: "비회원 주문 비밀번호를 입력해주세요." }, { status: 400 });
    }

    const parsed = parseCsRequestBody(body);
    if (!parsed.ok) {
      return NextResponse.json({ message: parsed.message }, { status: 400 });
    }

    const admin = createServiceClient();
    if (!admin) {
      return NextResponse.json({ message: "SUPABASE_SERVICE_ROLE_KEY가 필요합니다." }, { status: 503 });
    }

    const { data: order } = await admin
      .from("orders")
      .select("id, guest_password_hash")
      .eq("id", id)
      .maybeSingle();

    if (!order) {
      return NextResponse.json({ message: "주문을 찾을 수 없습니다." }, { status: 404 });
    }

    if (!order.guest_password_hash) {
      return NextResponse.json(
        { message: "회원 주문은 마이페이지에서 요청해주세요." },
        { status: 403 },
      );
    }

    const valid = await verifyGuestPassword(body.password, order.guest_password_hash);
    if (!valid) {
      return NextResponse.json({ message: "비밀번호가 일치하지 않습니다." }, { status: 401 });
    }

    const result = await createOrderCsRequest(admin, {
      orderId: id,
      type: parsed.type,
      reason: parsed.reason,
      exchangeSize: parsed.exchangeSize,
      orderItemId: parsed.orderItemId,
      actorUserId: null,
    });

    if (!result.ok) {
      return NextResponse.json({ message: result.message }, { status: result.status });
    }

    return NextResponse.json({
      ok: true,
      request: result.request,
      orderStatus: result.orderStatus,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "서버 오류" },
      { status: 500 },
    );
  }
}
