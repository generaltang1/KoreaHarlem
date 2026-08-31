"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatThinkDate, ThinkPostListItem } from "@/lib/think";

export function AdminThinkList() {
  const [posts, setPosts] = useState<ThinkPostListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/think/posts?tab=all&perPage=50");
    const json = (await res.json()) as { posts?: ThinkPostListItem[] };
    setPosts(json.posts ?? []);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const remove = async (id: string) => {
    if (!confirm("이 게시글을 삭제할까요?")) return;
    const res = await fetch(`/api/think/posts/${id}`, { method: "DELETE" });
    if (res.ok) setPosts((prev) => prev.filter((p) => p.id !== id));
    else alert("삭제에 실패했습니다.");
  };

  if (loading) return <p className="text-sm text-muted">불러오는 중…</p>;

  return (
    <div className="space-y-3">
      {posts.length === 0 ? (
        <p className="text-sm text-muted">게시글이 없습니다.</p>
      ) : (
        posts.map((post) => (
          <div key={post.id} className="flex flex-wrap items-center justify-between gap-3 border border-border p-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                {post.is_notice && (
                  <span className="text-[10px] uppercase tracking-widest text-muted">공지</span>
                )}
                <Link href={`/think/${post.id}`} className="truncate text-sm font-medium hover:underline">
                  {post.title}
                </Link>
              </div>
              <p className="mt-1 text-xs text-muted">
                {post.author_display} · {formatThinkDate(post.created_at)} · 추천 {post.recommend_count}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void remove(post.id)}
              className="text-xs text-red-600 underline"
            >
              삭제
            </button>
          </div>
        ))
      )}
    </div>
  );
}
