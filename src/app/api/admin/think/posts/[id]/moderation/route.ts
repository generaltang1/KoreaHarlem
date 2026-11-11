import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { isCurrentUserAdmin } from "@/lib/auth/session";
import { writeAdminAudit } from "@/lib/adminAudit";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  if (!(await isCurrentUserAdmin())) {
    return NextResponse.json({ message: "권한이 없습니다." }, { status: 403 });
  }
  const admin = createServiceClient();
  if (!admin) return NextResponse.json({ message: "SERVICE_ROLE_KEY 필요" }, { status: 503 });

  const { id } = await context.params;
  const body = (await request.json()) as {
    is_hidden?: boolean;
    hidden_reason?: string;
    is_notice?: boolean;
    report_id?: string;
    report_status?: "reviewed" | "dismissed" | "actioned";
  };

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (typeof body.is_hidden === "boolean") {
    patch.is_hidden = body.is_hidden;
    patch.hidden_at = body.is_hidden ? new Date().toISOString() : null;
    patch.hidden_reason = body.is_hidden ? (body.hidden_reason ?? "").trim() || null : null;
  }
  if (typeof body.is_notice === "boolean") {
    patch.is_notice = body.is_notice;
  }

  if (Object.keys(patch).length > 1) {
    const { error } = await admin.from("think_posts").update(patch).eq("id", id);
    if (error) return NextResponse.json({ message: error.message }, { status: 500 });
    if (typeof body.is_hidden === "boolean") {
      await writeAdminAudit({
        module: "think",
        action: body.is_hidden ? "hide_post" : "unhide_post",
        targetType: "think_post",
        targetId: id,
        summary: body.is_hidden ? "THINK 게시글 숨김" : "THINK 게시글 숨김 해제",
        meta: { hidden_reason: body.hidden_reason ?? null },
      });
    }
  }

  if (body.report_id && body.report_status) {
    const { error: reportError } = await admin
      .from("think_post_reports")
      .update({
        status: body.report_status,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", body.report_id);
    if (reportError) {
      return NextResponse.json({ message: reportError.message }, { status: 500 });
    }
    await writeAdminAudit({
      module: "think",
      action: "update_report",
      targetType: "think_post_report",
      targetId: body.report_id,
      summary: `THINK 신고 처리: ${body.report_status}`,
      meta: { post_id: id },
    });
  }

  return NextResponse.json({ ok: true });
}
