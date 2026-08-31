"use client";

import Link from "next/link";
import { useState } from "react";
import type { ThinkPostDetail } from "@/lib/think";
import { formatThinkDate, THINK_CONCEPT_THRESHOLD } from "@/lib/think";
import { ThinkPostContent } from "@/components/think/ThinkPostContent";

type ThinkPostDetailViewProps = {
  initialPost: ThinkPostDetail;
};

export function ThinkPostDetailView({ initialPost }: ThinkPostDetailViewProps) {
  const [post, setPost] = useState(initialPost);
  const [recommending, setRecommending] = useState(false);
  const [recommendMsg, setRecommendMsg] = useState("");

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
      setPost((prev) => ({ ...prev, recommend_count: json.recommend_count ?? prev.recommend_count }));
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
      <Link
        href="/think"
        className="mb-6 inline-flex text-[10px] uppercase tracking-widest text-muted hover:text-foreground"
      >
        ← 목록
      </Link>

      <div className="border border-border">
        <header className="border-b border-border px-4 py-4 md:px-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              {post.is_notice && (
                <span className="mb-2 inline-block border border-border px-2 py-0.5 text-[10px] uppercase tracking-widest">
                  공지
                </span>
              )}
              <h1 className="text-lg font-semibold md:text-xl">{post.title}</h1>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
            <span>{post.author_display}</span>
            <span>{formatThinkDate(post.created_at)}</span>
            <span>조회 {post.view_count}</span>
            <span>추천 {post.recommend_count}</span>
          </div>
        </header>

        <div className="px-4 py-6 md:px-6">
          <ThinkPostContent
            html={post.content_html}
            attachments={post.attachments}
            youtubeVideos={post.youtube_videos}
          />
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-4 md:px-6">
          <button
            type="button"
            onClick={() => void recommend()}
            disabled={recommending}
            className="border border-border px-5 py-2 text-xs hover:bg-neutral-50 disabled:opacity-50"
          >
            {recommending ? "처리 중…" : "추천"}
          </button>
          {recommendMsg && <p className="text-xs text-muted">{recommendMsg}</p>}
        </footer>
      </div>
    </article>
  );
}
