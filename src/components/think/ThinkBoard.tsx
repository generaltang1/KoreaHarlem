"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { formatThinkDate, ThinkPostListItem, ThinkTab, THINK_PAGE_SIZE } from "@/lib/think";

const TABS: { id: ThinkTab; label: string }[] = [
  { id: "all", label: "전체글" },
  { id: "concept", label: "개념글" },
  { id: "notice", label: "공지" },
];

export function ThinkBoard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = (searchParams.get("tab") as ThinkTab) || "all";
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
  const q = searchParams.get("q") ?? "";

  const [posts, setPosts] = useState<ThinkPostListItem[]>([]);
  const [pagination, setPagination] = useState({ page: 1, perPage: THINK_PAGE_SIZE, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(q);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ tab, page: String(page), perPage: String(THINK_PAGE_SIZE) });
      if (q) params.set("q", q);
      const res = await fetch(`/api/think/posts?${params}`);
      const json = (await res.json()) as {
        posts?: ThinkPostListItem[];
        pagination?: typeof pagination;
      };
      setPosts(json.posts ?? []);
      setPagination(json.pagination ?? { page: 1, perPage: THINK_PAGE_SIZE, total: 0, totalPages: 1 });
    } finally {
      setLoading(false);
    }
  }, [tab, page, q]);

  useEffect(() => {
    void loadPosts();
  }, [loadPosts]);

  const setTab = (next: ThinkTab) => {
    const params = new URLSearchParams();
    if (next !== "all") params.set("tab", next);
    if (q) params.set("q", q);
    router.push(`/think${params.toString() ? `?${params}` : ""}`);
  };

  const setPageNum = (nextPage: number) => {
    const params = new URLSearchParams();
    if (tab !== "all") params.set("tab", tab);
    if (nextPage > 1) params.set("page", String(nextPage));
    if (q) params.set("q", q);
    router.push(`/think?${params}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (tab !== "all") params.set("tab", tab);
    if (searchInput.trim()) params.set("q", searchInput.trim());
    router.push(`/think${params.toString() ? `?${params}` : ""}`);
  };

  const pageNumbers = () => {
    const { totalPages } = pagination;
    const current = pagination.page;
    const pages: number[] = [];
    const start = Math.max(1, current - 7);
    const end = Math.min(totalPages, start + 14);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted">Think</p>
          <h1 className="mt-1 text-2xl font-semibold">THINK</h1>
        </div>
        <Link
          href="/think/new"
          className="border border-foreground bg-foreground px-5 py-2.5 text-[10px] uppercase tracking-widest text-background"
        >
          글쓰기
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border border-border bg-neutral-50 px-3 py-2">
        <div className="flex gap-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 text-xs ${
                tab === t.id
                  ? "bg-foreground text-background"
                  : "border border-border bg-background text-foreground hover:bg-neutral-100"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <span className="text-[10px] text-muted">{pagination.total}개</span>
      </div>

      <div className="overflow-x-auto border border-border">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-border bg-neutral-50 text-[10px] uppercase tracking-widest text-muted">
            <tr>
              <th className="w-16 px-3 py-2.5">번호</th>
              <th className="px-3 py-2.5">제목</th>
              <th className="w-28 px-3 py-2.5">글쓴이</th>
              <th className="w-20 px-3 py-2.5">작성일</th>
              <th className="w-14 px-3 py-2.5 text-right">조회</th>
              <th className="w-14 px-3 py-2.5 text-right">추천</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-3 py-12 text-center text-xs text-muted">
                  불러오는 중…
                </td>
              </tr>
            ) : posts.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-12 text-center text-xs text-muted">
                  게시글이 없습니다.
                </td>
              </tr>
            ) : (
              posts.map((post, index) => {
                const displayNum = pagination.total - (pagination.page - 1) * pagination.perPage - index;
                return (
                  <tr key={post.id} className="hover:bg-neutral-50">
                    <td className="px-3 py-2.5 text-xs text-muted">
                      {post.is_notice ? (
                        <span className="font-semibold text-foreground">공지</span>
                      ) : (
                        displayNum
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <Link href={`/think/${post.id}`} className="hover:underline">
                        {post.title}
                      </Link>
                    </td>
                    <td className="max-w-[7rem] truncate px-3 py-2.5 text-xs text-muted">
                      {post.author_display}
                    </td>
                    <td className="px-3 py-2.5 text-xs tabular-nums text-muted">
                      {formatThinkDate(post.created_at)}
                    </td>
                    <td className="px-3 py-2.5 text-right text-xs tabular-nums text-muted">
                      {post.view_count}
                    </td>
                    <td className="px-3 py-2.5 text-right text-xs tabular-nums text-muted">
                      {post.recommend_count}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {pagination.totalPages > 1 && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-1">
          {pageNumbers().map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setPageNum(n)}
              className={`min-w-[2rem] px-2 py-1 text-xs ${
                n === pagination.page ? "font-semibold text-red-600" : "text-muted hover:text-foreground"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={handleSearch} className="mt-8 flex justify-center gap-2">
        <select className="border border-border px-2 py-2 text-xs" defaultValue="title_content" disabled>
          <option value="title_content">제목+내용</option>
        </select>
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="검색어"
          className="w-48 border border-border px-3 py-2 text-sm outline-none focus:border-foreground sm:w-64"
        />
        <button type="submit" className="border border-foreground bg-foreground px-4 py-2 text-xs text-background">
          검색
        </button>
      </form>
    </div>
  );
}
