import { NextResponse } from "next/server";
import { finalizeCsAttachments } from "@/lib/createOrderCsRequest";
import { verifyGuestPassword } from "@/lib/guestPassword";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";

type RouteContext = { params: Promise<{ id: string; requestId: string }> };

/** 첨부 업로드 완료 후 public URL 저장 */
export async function POST(request: Request, context: RouteContext) {
  try {
    const { id, requestId } = await context.params;
    const body = (await request.json()) as {
      password?: string;
      uploads?: { path: string; fileName: string; mimeType: string }[];
    };

    const admin = createServiceClient();
    if (!admin) {
      return NextResponse.json({ message: "SUPABASE_SERVICE_ROLE_KEY가 필요합니다." }, { status: 503 });
    }

    const { data: csReq } = await admin
      .from("order_cs_requests")
      .select("id, order_id, user_id")
      .eq("id", requestId)
      .eq("order_id", id)
      .maybeSingle();

    if (!csReq) {
      return NextResponse.json({ message: "요청을 찾을 수 없습니다." }, { status: 404 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (csReq.user_id) {
      if (!user || user.id !== csReq.user_id) {
        return NextResponse.json({ message: "권한이 없습니다." }, { status: 403 });
      }
    } else {
      if (!body.password) {
        return NextResponse.json({ message: "주문 비밀번호가 필요합니다." }, { status: 400 });
      }
      const { data: order } = await admin
        .from("orders")
        .select("guest_password_hash")
        .eq("id", id)
        .maybeSingle();
      if (!order?.guest_password_hash) {
        return NextResponse.json({ message: "권한이 없습니다." }, { status: 403 });
      }
      const ok = await verifyGuestPassword(body.password, order.guest_password_hash);
      if (!ok) {
        return NextResponse.json({ message: "비밀번호가 올바르지 않습니다." }, { status: 403 });
      }
    }

    const result = await finalizeCsAttachments(admin, requestId, body.uploads ?? []);
    if (!result.ok) {
      return NextResponse.json({ message: result.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "서버 오류" },
      { status: 500 },
    );
  }
}
