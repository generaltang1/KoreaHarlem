import { NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/adminApi";
import { createServiceClient } from "@/lib/supabase/admin";

/** 관리자 제보 목록 */
export async function GET() {
  const auth = await assertAdminApi();
  if (auth.error) return auth.error;

  const admin = createServiceClient();
  if (!admin) {
    return NextResponse.json({ message: "SUPABASE_SERVICE_ROLE_KEY가 필요합니다." }, { status: 503 });
  }

  const { data, error } = await admin
    .from("tip_reports")
    .select("id, title, user_id, created_at, tip_report_attachments(id)")
    .order("created_at", { ascending: false })
    .limit(200);

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

  const tips = (data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    user_id: row.user_id,
    created_at: row.created_at,
    attachment_count: Array.isArray(row.tip_report_attachments)
      ? row.tip_report_attachments.length
      : 0,
  }));

  return NextResponse.json({ tips });
}
