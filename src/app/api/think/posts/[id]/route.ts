import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { formatThinkAuthorDisplay } from "@/lib/think";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const admin = createServiceClient();
  if (!admin) {
    return NextResponse.json({ message: "SUPABASE_SERVICE_ROLE_KEY가 필요합니다." }, { status: 503 });
  }

  const { id } = await context.params;

  const { data: post, error } = await admin.from("think_posts").select("*").eq("id", id).maybeSingle();
  if (error || !post) {
    return NextResponse.json({ message: "게시글을 찾을 수 없습니다." }, { status: 404 });
  }

  await admin
    .from("think_posts")
    .update({ view_count: (post.view_count ?? 0) + 1 })
    .eq("id", id);

  const [{ data: attachments }, { data: youtubeVideos }] = await Promise.all([
    admin.from("think_post_attachments").select("*").eq("post_id", id).order("sort_order"),
    admin.from("think_post_youtube").select("*").eq("post_id", id).order("sort_order"),
  ]);

  return NextResponse.json({
    post: {
      ...post,
      view_count: (post.view_count ?? 0) + 1,
      author_display: formatThinkAuthorDisplay(post),
      attachments: attachments ?? [],
      youtube_videos: youtubeVideos ?? [],
    },
  });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const admin = createServiceClient();
  if (!admin) {
    return NextResponse.json({ message: "SUPABASE_SERVICE_ROLE_KEY가 필요합니다." }, { status: 503 });
  }

  const { isCurrentUserAdmin } = await import("@/lib/auth/session");
  if (!(await isCurrentUserAdmin())) {
    return NextResponse.json({ message: "권한이 없습니다." }, { status: 403 });
  }

  const { id } = await context.params;
  const { error } = await admin.from("think_posts").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ message: "삭제에 실패했습니다." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
