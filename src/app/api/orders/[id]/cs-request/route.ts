import { NextResponse } from "next/server";
import type { CsRequestType } from "@/lib/csRequests";
import {
  createCsAttachmentUploadSlots,
  createOrderCsRequest,
  parseCsRequestBody,
} from "@/lib/createOrderCsRequest";
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
      reasonCode?: string;
      returnShippingFeeKrw?: number;
      attachments?: { name: string; mimeType: string }[];
    };

    const parsed = parseCsRequestBody(body);
    if (!parsed.ok) {
      return NextResponse.json({ message: parsed.message }, { status: 400 });
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
      .select("id, user_id")
      .eq("id", id)
      .maybeSingle();

    if (!order || order.user_id !== user.id) {
      return NextResponse.json({ message: "주문을 찾을 수 없습니다." }, { status: 404 });
    }

    const result = await createOrderCsRequest(admin, {
      orderId: id,
      type: parsed.type,
      reason: parsed.reason,
      exchangeSize: parsed.exchangeSize,
      orderItemId: parsed.orderItemId,
      reasonCode: parsed.reasonCode,
      returnShippingFeeKrw: parsed.returnShippingFeeKrw,
      actorUserId: user.id,
    });

    if (!result.ok) {
      return NextResponse.json({ message: result.message }, { status: result.status });
    }

    let uploads: {
      path: string;
      token: string;
      signedUrl: string;
      fileName: string;
      mimeType: string;
    }[] = [];

    if (parsed.attachments.length > 0) {
      const slots = await createCsAttachmentUploadSlots(
        admin,
        result.request.id,
        parsed.attachments,
      );
      if (!slots.ok) {
        await admin.from("order_cs_requests").delete().eq("id", result.request.id);
        return NextResponse.json({ message: slots.message }, { status: 500 });
      }
      uploads = slots.uploads;
    }

    return NextResponse.json({
      ok: true,
      request: result.request,
      orderStatus: result.orderStatus,
      uploads,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "서버 오류" },
      { status: 500 },
    );
  }
}
