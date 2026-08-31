import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext) {
  const admin = createServiceClient();
  if (!admin) {
    return NextResponse.json({ message: "SUPABASE_SERVICE_ROLE_KEY가 필요합니다." }, { status: 503 });
  }

  const { id: postId } = await context.params;

  const folders = ["images", "videos"];
  for (const folder of folders) {
    const { data: files } = await admin.storage.from("think").list(`posts/${postId}/${folder}`, {
      limit: 100,
    });
    if (files?.length) {
      const paths = files.map((f) => `posts/${postId}/${folder}/${f.name}`);
      await admin.storage.from("think").remove(paths);
    }
  }

  const { data: rootFiles } = await admin.storage.from("think").list(`posts/${postId}`, { limit: 100 });
  if (rootFiles?.length) {
    const paths = rootFiles.map((f) => `posts/${postId}/${f.name}`);
    await admin.storage.from("think").remove(paths);
  }

  await admin.from("think_posts").delete().eq("id", postId);

  return NextResponse.json({ ok: true });
}
