"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import type { ThinkPostDetail } from "@/lib/think";
import { THINK_CONCEPT_THRESHOLD, formatThinkDate } from "@/lib/think";
import { ThinkPostContent } from "@/components/think/ThinkPostContent";
import { ThinkComments } from "@/components/think/ThinkComments";
import { ThinkReportButton } from "@/components/think/ThinkReportButton";
import { mp } from "@/lib/mypageTheme";

type ThinkPostDetailViewProps = {
  initialPost: ThinkPostDetail;
  isLoggedIn?: boolean;
  canEdit?: boolean;
};

export function ThinkPostDetailView({
  initialPost,
  isLoggedIn = false,
  canEdit = false,
}: ThinkPostDetailViewProps) {
  const [post, setPost] = useState(initialPost);
  const [recommending, setRecommending] = useState(false);
  const [recommendMsg, setRecommendMsg] = useState("");

  const onCountChange = useCallback((count: number) => {
    setPost((prev) => ({ ...prev, comment_count: count }));
  }, []);

  const recommend = async () => {
    setRecommending(true);
    setRecommendMsg("");
    try {
      const res = await fetch(`/api/think/posts/${post.id}/recommend`, { method: "POST" });
      const json = (await res.json()) as {
        message?: string;
        recommend_count?: number;
        is_concept?: boolean;
      };
      if (!res.ok) throw new Error(json.message || "추천에 실패했습니다.");
      setPost((prev) => ({
        ...prev,
        recommend_count: json.recommend_count ?? prev.recommend_count,
      }));
      if (json.is_concept) {
        setRecommendMsg(`추천 ${THINK_CONCEPT_THRESHOLD}개 달성! 개념글에 등록됩니다.`);
      } else {
        setRecommendMsg("추천했습니다.");
      }
    } catch (err: unknown) {
      setRecommendMsg(err instanceof Error ? err.message : "추천에 실패했습니다.");
    } finally {
      setRecommending(false);
    }
  };

  return (
    <article>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/think"
          className={`text-[11px] uppercase tracking-[0.14em] ${mp.muted} transition hover:text-[#f4f1ea]`}
        >
          ← 목록
        </Link>
        {canEdit ? (
          <Link href={`/think/${post.id}/edit`} className={mp.ghostBtn}>
            수정
          </Link>
        ) : null}
      </div>

      <div className={mp.card}>
        <header className="border-b border-[rgba(244,241,234,0.12)] px-5 py-6 md:px-7">
          <div className="flex flex-wrap items-start gap-2">
            {post.is_notice ? (
              <span className="rounded-[4px] border border-[#FBC201]/40 px-2 py-0.5 text-[10px] font-medium text-[#FBC201]">
                공지
              </span>
            ) : null}
            {post.flair ? (
              <span className={`rounded-[4px] px-2 py-0.5 text-[10px] ${mp.pillActive}`}>
                {post.flair}
              </span>
            ) : null}
          </div>
          <h1 className="mt-3 text-[22px] font-bold leading-snug tracking-[-0.02em] text-[#f4f1ea] md:text-[28px]">
            {post.title}
          </h1>
          <div
            className={`mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-[rgba(244,241,234,0.08)] pt-4 text-xs ${mp.muted}`}
          >
            <span className="font-medium text-[#f4f1ea]">{post.author_display}</span>
            <span className="tabular-nums">{formatThinkDate(post.created_at)}</span>
            <span className="tabular-nums">조회 {post.view_count}</span>
            <span className={`tabular-nums ${mp.yellow}`}>♥ {post.recommend_count}</span>
            <span className="tabular-nums">댓글 {post.comment_count ?? 0}</span>
            <span className="ml-auto">
              <ThinkReportButton postId={post.id} />
            </span>
          </div>
        </header>

        <div className="px-5 py-7 md:px-7">
          <ThinkPostContent
            html={post.content_html}
            attachments={post.attachments}
            youtubeVideos={post.youtube_videos}
          />
        </div>

        <footer className="flex flex-col items-center gap-3 border-t border-[rgba(244,241,234,0.12)] px-5 py-6 md:px-7">
          <p className={`text-[11px] ${mp.tertiary}`}>이 글이 도움이 됐다면 추천해 주세요</p>
          <button
            type="button"
            onClick={() => void recommend()}
            disabled={recommending}
            className={`${mp.creamBtn} min-w-[140px] gap-2 px-6 py-3`}
            aria-label="추천"
          >
            <span className="text-[#c41e3a]" aria-hidden>
              ♥
            </span>
            <span>{recommending ? "…" : `추천 ${post.recommend_count}`}</span>
          </button>
          {recommendMsg ? <p className={`text-xs ${mp.muted}`}>{recommendMsg}</p> : null}
        </footer>
      </div>

      <ThinkComments postId={post.id} isLoggedIn={isLoggedIn} onCountChange={onCountChange} />
    </article>
  );
}
