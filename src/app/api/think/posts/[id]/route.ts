import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { getCurrentUser, isCurrentUserAdmin, isCurrentUserBlocked } from "@/lib/auth/session";
import {
  THINK_FLAIRS,
  THINK_MAX_CONTENT_LENGTH,
  THINK_MAX_TITLE_LENGTH,
  formatThinkAuthorDisplay,
  sanitizeThinkHtml,
} from "@/lib/think";

type RouteContext = { params: Promise<{ id: string }> };

type ThinkPatchBody = {
  title?: string;
  contentHtml?: string;
  flair?: string | null;
  isNotice?: boolean;
};

function normalizeFlair(input: string | null | undefined): string | null {
  const v = (input ?? "").trim();
  if (!v) return null;
  if ((THINK_FLAIRS as readonly string[]).includes(v)) return v;
  return null;
}

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

  if (post.is_hidden) {
    if (!(await isCurrentUserAdmin())) {
      return NextResponse.json({ message: "숨겨진 글입니다.", hidden: true }, { status: 404 });
    }
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

/** 작성자 본인 수정 (텍스트·플레어·공지). 첨부는 신규 업로드 플로우 유지 */
export async function PATCH(request: Request, context: RouteContext) {
  const admin = createServiceClient();
  if (!admin) {
    return NextResponse.json({ message: "SUPABASE_SERVICE_ROLE_KEY가 필요합니다." }, { status: 503 });
  }

  if (await isCurrentUserBlocked()) {
    return NextResponse.json({ message: "이용이 제한된 계정입니다." }, { status: 403 });
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
  }

  const { id } = await context.params;
  const { data: post } = await admin.from("think_posts").select("id, user_id").eq("id", id).maybeSingle();
  if (!post) {
    return NextResponse.json({ message: "게시글을 찾을 수 없습니다." }, { status: 404 });
  }

  const isAdmin = await isCurrentUserAdmin();
  if (post.user_id !== user.id && !isAdmin) {
    return NextResponse.json({ message: "수정 권한이 없습니다." }, { status: 403 });
  }

  let body: ThinkPatchBody;
  try {
    body = (await request.json()) as ThinkPatchBody;
  } catch {
    return NextResponse.json({ message: "잘못된 요청입니다." }, { status: 400 });
  }

  const title = String(body.title ?? "").trim();
  const contentHtml = sanitizeThinkHtml(String(body.contentHtml ?? ""));
  if (!title) return NextResponse.json({ message: "제목을 입력해주세요." }, { status: 400 });
  if (title.length > THINK_MAX_TITLE_LENGTH) {
    return NextResponse.json({ message: "제목이 너무 깁니다." }, { status: 400 });
  }
  if (contentHtml.length > THINK_MAX_CONTENT_LENGTH) {
    return NextResponse.json({ message: "내용이 너무 깁니다." }, { status: 400 });
  }

  const patch: Record<string, unknown> = {
    title,
    content_html: contentHtml,
    flair: normalizeFlair(body.flair),
    updated_at: new Date().toISOString(),
  };

  if (typeof body.isNotice === "boolean") {
    if (!isAdmin) {
      return NextResponse.json({ message: "공지는 관리자만 변경할 수 있습니다." }, { status: 403 });
    }
    patch.is_notice = body.isNotice;
  }

  const { error } = await admin.from("think_posts").update(patch).eq("id", id);
  if (error) {
    console.error("[think patch]", error.message);
    return NextResponse.json(
      {
        message: error.message.includes("flair")
          ? "플레어 컬럼이 없습니다. supabase/add_think_flair.sql 을 실행해 주세요."
          : "수정에 실패했습니다.",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, id });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const admin = createServiceClient();
  if (!admin) {
    return NextResponse.json({ message: "SUPABASE_SERVICE_ROLE_KEY가 필요합니다." }, { status: 503 });
  }

  const user = await getCurrentUser();
  const isAdmin = await isCurrentUserAdmin();
  const { id } = await context.params;

  const { data: post } = await admin.from("think_posts").select("id, user_id").eq("id", id).maybeSingle();
  if (!post) {
    return NextResponse.json({ message: "게시글을 찾을 수 없습니다." }, { status: 404 });
  }

  if (!isAdmin && (!user || post.user_id !== user.id)) {
    return NextResponse.json({ message: "권한이 없습니다." }, { status: 403 });
  }

  const { error } = await admin.from("think_posts").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ message: "삭제에 실패했습니다." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
