import { NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/adminApi";
import { createServiceClient } from "@/lib/supabase/admin";

type RouteContext = { params: Promise<{ id: string }> };

/** 관리자 제보 상세 */
export async function GET(_request: Request, context: RouteContext) {
  const auth = await assertAdminApi();
  if (auth.error) return auth.error;

  const { id } = await context.params;
  const admin = createServiceClient();
  if (!admin) {
    return NextResponse.json({ message: "SUPABASE_SERVICE_ROLE_KEY가 필요합니다." }, { status: 503 });
  }

  const { data: tip, error } = await admin
    .from("tip_reports")
    .select(
      "id, title, content_html, user_id, created_at, tip_report_attachments(id, file_url, file_name, mime_type, kind, sort_order, created_at)",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      {
        message: error.message.includes("tip_reports")
          ? "add_tip_reports.sql을 실행해주세요."
          : error.message,
      },
      { status: 500 },
    );
  }
  if (!tip) {
    return NextResponse.json({ message: "제보를 찾을 수 없습니다." }, { status: 404 });
  }

  const attachments = [...(tip.tip_report_attachments ?? [])].sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
  );

  return NextResponse.json({
    tip: {
      id: tip.id,
      title: tip.title,
      content_html: tip.content_html,
      user_id: tip.user_id,
      created_at: tip.created_at,
      attachments,
    },
  });
}

/** 관리자 제보 삭제 (+ storage 파일) */
export async function DELETE(_request: Request, context: RouteContext) {
  const auth = await assertAdminApi();
  if (auth.error) return auth.error;

  const { id } = await context.params;
  const admin = createServiceClient();
  if (!admin) {
    return NextResponse.json({ message: "SUPABASE_SERVICE_ROLE_KEY가 필요합니다." }, { status: 503 });
  }

  // storage: tipId/ 하위 경로 삭제 시도
  try {
    const { data: files } = await admin.storage.from("tips").list(id, { limit: 100 });
    if (files && files.length > 0) {
      const paths = files.map((f) => `${id}/${f.name}`);
      // nested folders paste/ files/
      for (const folder of ["paste", "files"]) {
        const { data: nested } = await admin.storage.from("tips").list(`${id}/${folder}`, { limit: 100 });
        if (nested) {
          for (const f of nested) paths.push(`${id}/${folder}/${f.name}`);
        }
      }
      if (paths.length > 0) {
        await admin.storage.from("tips").remove(paths);
      }
    }
  } catch (err) {
    console.error("[admin tips delete storage]", err);
  }

  const { error } = await admin.from("tip_reports").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
