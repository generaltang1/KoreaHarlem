import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth/session";
import { getClientIp } from "@/lib/requestIp";
import { THINK_REPORT_REASONS } from "@/lib/think";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const admin = createServiceClient();
  if (!admin) {
    return NextResponse.json({ message: "SUPABASE_SERVICE_ROLE_KEY가 필요합니다." }, { status: 503 });
  }

  const { id } = await context.params;
  const body = (await request.json()) as { reason?: string };
  const reason = (body.reason ?? "").trim();
  if (!reason) {
    return NextResponse.json({ message: "신고 사유를 선택하세요." }, { status: 400 });
  }
  if (
    reason.length > 200 ||
    (!(THINK_REPORT_REASONS as readonly string[]).includes(reason) && reason.length < 2)
  ) {
    return NextResponse.json({ message: "신고 사유가 올바르지 않습니다." }, { status: 400 });
  }

  const { data: post } = await admin.from("think_posts").select("id, is_hidden").eq("id", id).maybeSingle();
  if (!post || post.is_hidden) {
    return NextResponse.json({ message: "게시글을 찾을 수 없습니다." }, { status: 404 });
  }

  const user = await getCurrentUser();
  const ip = getClientIp(request) || "0.0.0.0";

  // 동일 사용자/IP 중복 오픈 신고 방지
  let dupQuery = admin
    .from("think_post_reports")
    .select("id")
    .eq("post_id", id)
    .eq("status", "open")
    .limit(1);
  if (user?.id) {
    dupQuery = dupQuery.eq("reporter_user_id", user.id);
  } else {
    dupQuery = dupQuery.eq("reporter_ip", ip).is("reporter_user_id", null);
  }
  const { data: existing } = await dupQuery.maybeSingle();
  if (existing) {
    return NextResponse.json({ message: "이미 신고한 게시글입니다." }, { status: 409 });
  }

  const { error } = await admin.from("think_post_reports").insert({
    post_id: id,
    reporter_user_id: user?.id ?? null,
    reporter_ip: ip,
    reason,
    status: "open",
  });

  if (error) {
    console.error("[think report]", error.message);
    return NextResponse.json(
      {
        message: error.message.includes("think_post_reports")
          ? "신고 테이블이 없습니다. supabase/add_admin_ops_features.sql 을 실행하세요."
          : "신고에 실패했습니다.",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, message: "신고가 접수되었습니다." });
}
