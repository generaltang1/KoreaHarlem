import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { isCurrentUserAdmin } from "@/lib/auth/session";

export async function GET() {
  if (!(await isCurrentUserAdmin())) {
    return NextResponse.json({ message: "권한이 없습니다." }, { status: 403 });
  }
  const admin = createServiceClient();
  if (!admin) return NextResponse.json({ message: "SERVICE_ROLE_KEY 필요" }, { status: 503 });

  const { data, error } = await admin
    .from("think_post_reports")
    .select("*, think_posts(id, title, is_hidden, author_nickname)")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
  return NextResponse.json({ reports: data ?? [] });
}
