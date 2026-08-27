import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";

type RouteContext = { params: Promise<{ id: string }> };

/** 업로드 실패 시 제보·Storage 정리 */
export async function POST(_request: Request, context: RouteContext) {
  const admin = createServiceClient();
  if (!admin) {
    return NextResponse.json(
      { message: "SUPABASE_SERVICE_ROLE_KEY가 필요합니다." },
      { status: 503 },
    );
  }

  const { id: tipId } = await context.params;

  const paths: string[] = [];
  for (const folder of ["paste", "files"]) {
    const { data: files } = await admin.storage.from("tips").list(`${tipId}/${folder}`, { limit: 100 });
    for (const f of files ?? []) {
      if (f.name) paths.push(`${tipId}/${folder}/${f.name}`);
    }
  }
  if (paths.length > 0) {
    await admin.storage.from("tips").remove(paths);
  }

  await admin.from("tip_reports").delete().eq("id", tipId);

  return NextResponse.json({ ok: true });
}
