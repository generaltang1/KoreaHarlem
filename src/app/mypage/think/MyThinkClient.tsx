"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  THINK_PAGE_SIZE,
  ThinkPostListItem,
  formatThinkDate,
} from "@/lib/think";
import { mp } from "@/lib/mypageTheme";

export function MyThinkClient() {
  const [posts, setPosts] = useState<ThinkPostListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        mine: "1",
        page: String(page),
        perPage: String(THINK_PAGE_SIZE),
        sort: "latest",
      });
      const res = await fetch(`/api/think/posts?${params}`);
      const json = (await res.json()) as {
        posts?: ThinkPostListItem[];
        pagination?: { totalPages: number };
        message?: string;
      };
      if (!res.ok) throw new Error(json.message || "불러오기 실패");
      setPosts(json.posts ?? []);
      setTotalPages(json.pagination?.totalPages ?? 1);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "불러오기 실패");
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className={`text-sm ${mp.muted}`}>작성한 THINK 글 목록입니다.</p>
        <Link href="/think/new" className={mp.creamBtn}>
          글쓰기
        </Link>
      </div>

      <div className={mp.card}>
        {loading ? (
          <p className={`px-4 py-10 text-center text-sm ${mp.muted}`}>불러오는 중…</p>
        ) : error ? (
          <p className="px-4 py-10 text-center text-sm text-rose-300">{error}</p>
        ) : posts.length === 0 ? (
          <p className={`px-4 py-10 text-center text-sm ${mp.muted}`}>아직 작성한 글이 없습니다.</p>
        ) : (
          <ul className="divide-y divide-[rgba(244,241,234,0.08)]">
            {posts.map((post) => (
              <li key={post.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5">
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/think/${post.id}`}
                    className="block truncate font-medium text-[#f4f1ea] hover:text-[#FBC201]"
                  >
                    {post.flair ? (
                      <span className={`mr-2 text-[10px] ${mp.yellow}`}>[{post.flair}]</span>
                    ) : null}
                    {post.title}
                  </Link>
                  <p className={`mt-1 text-[11px] ${mp.tertiary}`}>
                    {formatThinkDate(post.created_at)} · 조회 {post.view_count} · ♥{" "}
                    {post.recommend_count}
                    {post.is_hidden ? " · 숨김" : ""}
                  </p>
                </div>
                <Link href={`/think/${post.id}/edit`} className={`${mp.ghostBtn} shrink-0 text-xs`}>
                  수정
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {totalPages > 1 ? (
        <div className="flex justify-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className={mp.ghostBtn}
          >
            이전
          </button>
          <span className={`self-center text-xs ${mp.muted}`}>
            {page} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className={mp.ghostBtn}
          >
            다음
          </button>
        </div>
      ) : null}
    </div>
  );
}
