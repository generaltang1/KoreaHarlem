import Link from "next/link";
import { notFound } from "next/navigation";
import { ThinkShell } from "@/components/think/ThinkShell";
import { ThinkPostDetailView } from "@/components/think/ThinkPostDetailView";
import { createServiceClient } from "@/lib/supabase/admin";
import { getCurrentUser, isCurrentUserAdmin } from "@/lib/auth/session";
import { formatThinkAuthorDisplay, type ThinkPostDetail } from "@/lib/think";
import { mp } from "@/lib/mypageTheme";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ThinkPostPage({ params }: PageProps) {
  const { id } = await params;
  const admin = createServiceClient();
  if (!admin) notFound();

  const { data: post } = await admin.from("think_posts").select("*").eq("id", id).maybeSingle();
  if (!post) notFound();

  const user = await getCurrentUser();
  const isAdmin = await isCurrentUserAdmin();

  if (post.is_hidden && !isAdmin) {
    return (
      <ThinkShell maxWidthClass="max-w-lg">
        <div className={`${mp.card} p-8 text-center`}>
          <p className={`font-mono text-[11px] tracking-[1.4px] ${mp.yellow}`}>THINK</p>
          <h1 className="mt-2 text-xl font-bold text-[#f4f1ea]">숨겨진 글입니다</h1>
          <p className={`mt-3 text-sm ${mp.muted}`}>
            운영 정책에 따라 이 게시글은 공개되지 않습니다.
            {post.hidden_reason ? ` (${post.hidden_reason})` : ""}
          </p>
          <Link href="/think" className={`${mp.creamBtn} mt-8`}>
            목록으로
          </Link>
        </div>
      </ThinkShell>
    );
  }

  await admin
    .from("think_posts")
    .update({ view_count: (post.view_count ?? 0) + 1 })
    .eq("id", id);

  const viewCount = (post.view_count ?? 0) + 1;

  const [{ data: attachments }, { data: youtubeVideos }] = await Promise.all([
    admin.from("think_post_attachments").select("*").eq("post_id", id).order("sort_order"),
    admin.from("think_post_youtube").select("*").eq("post_id", id).order("sort_order"),
  ]);

  const detail: ThinkPostDetail = {
    ...post,
    view_count: viewCount,
    author_display: formatThinkAuthorDisplay(post),
    attachments: attachments ?? [],
    youtube_videos: youtubeVideos ?? [],
  };

  const canEdit = Boolean(user && (isAdmin || post.user_id === user.id));

  return (
    <ThinkShell maxWidthClass="max-w-3xl">
      {post.is_hidden && isAdmin ? (
        <p className="mb-4 rounded-[8px] border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
          관리자 보기 · 이 글은 숨김 상태입니다
          {post.hidden_reason ? ` — ${post.hidden_reason}` : ""}
        </p>
      ) : null}
      <ThinkPostDetailView initialPost={detail} isLoggedIn={!!user} canEdit={canEdit} />
    </ThinkShell>
  );
}
