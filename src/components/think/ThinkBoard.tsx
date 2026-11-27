"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  THINK_FLAIRS,
  THINK_PAGE_SIZE,
  THINK_SORTS,
  ThinkPostListItem,
  ThinkSort,
  ThinkTab,
  formatThinkDate,
} from "@/lib/think";
import { mp } from "@/lib/mypageTheme";

const TABS: { id: ThinkTab; label: string }[] = [
  { id: "all", label: "전체글" },
  { id: "concept", label: "개념글" },
  { id: "notice", label: "공지" },
];

function buildThinkHref(opts: {
  tab?: ThinkTab;
  sort?: ThinkSort;
  flair?: string;
  page?: number;
  q?: string;
}) {
  const params = new URLSearchParams();
  if (opts.tab && opts.tab !== "all") params.set("tab", opts.tab);
  if (opts.sort && opts.sort !== "latest") params.set("sort", opts.sort);
  if (opts.flair) params.set("flair", opts.flair);
  if (opts.page && opts.page > 1) params.set("page", String(opts.page));
  if (opts.q) params.set("q", opts.q);
  const qs = params.toString();
  return qs ? `/think?${qs}` : "/think";
}

export function ThinkBoard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = (searchParams.get("tab") as ThinkTab) || "all";
  const sort = (searchParams.get("sort") as ThinkSort) || "latest";
  const flair = searchParams.get("flair") ?? "";
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
  const q = searchParams.get("q") ?? "";

  const [posts, setPosts] = useState<ThinkPostListItem[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    perPage: THINK_PAGE_SIZE,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(q);
  const [loadError, setLoadError] = useState("");

  const loadPosts = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const params = new URLSearchParams({
        tab,
        page: String(page),
        perPage: String(THINK_PAGE_SIZE),
        sort,
      });
      if (q) params.set("q", q);
      if (flair) params.set("flair", flair);
      const res = await fetch(`/api/think/posts?${params}`);
      const json = (await res.json()) as {
        posts?: ThinkPostListItem[];
        pagination?: typeof pagination;
        message?: string;
      };
      if (!res.ok) throw new Error(json.message || "목록을 불러오지 못했습니다.");
      setPosts(json.posts ?? []);
      setPagination(
        json.pagination ?? { page: 1, perPage: THINK_PAGE_SIZE, total: 0, totalPages: 1 },
      );
    } catch (err: unknown) {
      setPosts([]);
      setLoadError(err instanceof Error ? err.message : "목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [tab, page, q, sort, flair]);

  useEffect(() => {
    void loadPosts();
  }, [loadPosts]);

  useEffect(() => {
    setSearchInput(q);
  }, [q]);

  const go = (next: {
    tab?: ThinkTab;
    sort?: ThinkSort;
    flair?: string;
    page?: number;
    q?: string;
  }) => {
    router.push(
      buildThinkHref({
        tab: next.tab ?? tab,
        sort: next.sort ?? sort,
        flair: next.flair === undefined ? flair : next.flair,
        page: next.page ?? 1,
        q: next.q === undefined ? q : next.q,
      }),
    );
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    go({ q: searchInput.trim(), page: 1 });
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
      {/* D-01 히어로 */}
      <div className="mb-8 flex flex-wrap items-end justify-between gap-5 border-b border-[rgba(244,241,234,0.12)] pb-8">
        <div className="max-w-2xl">
          <div
            className={`inline-flex items-center gap-2 rounded-[4px] border border-[rgba(244,241,234,0.12)] bg-[rgba(244,241,234,0.04)] px-2.5 py-1 font-mono text-[10px] uppercase tracking-[1.6px] ${mp.muted}`}
          >
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#FBC201]" aria-hidden />
            Anonymous sub-culture bulletin
          </div>
          <h1 className="mt-3 text-[36px] font-black tracking-[-0.04em] text-[#f4f1ea] sm:text-[48px]">
            THINK
          </h1>
          <p className={`mt-3 text-sm leading-relaxed ${mp.muted} sm:text-[15px]`}>
            거리의 생각, 익명 담론 아카이브. 서브컬처·사운드·패션·밤에 대한 메모.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/mypage/think" className={mp.ghostBtn}>
            내 THINK
          </Link>
          <Link href="/think/new" className={mp.creamBtn}>
            글쓰기
          </Link>
        </div>
      </div>

      {/* 정렬 — 세그먼트 */}
      <div
        className={`${mp.card} mb-3 flex flex-wrap gap-1 p-1.5`}
        role="tablist"
        aria-label="정렬"
      >
        {THINK_SORTS.map((s) => (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={sort === s.id}
            onClick={() => go({ sort: s.id, page: 1 })}
            className={
              sort === s.id
                ? "rounded-[6px] bg-[#f4f1ea] px-3.5 py-2 text-xs font-semibold text-[#0a0a0a]"
                : `rounded-[6px] px-3.5 py-2 text-xs ${mp.muted} transition-colors hover:bg-[rgba(244,241,234,0.06)] hover:text-[#f4f1ea]`
            }
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* 탭 */}
      <div className={`${mp.card} mb-3 flex flex-wrap items-center justify-between gap-3 px-3 py-2.5`}>
        <div className="flex flex-wrap gap-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => go({ tab: t.id, page: 1 })}
              className={tab === t.id ? mp.pillActive : mp.pill}
            >
              {t.label}
            </button>
          ))}
        </div>
        <span className={`text-[11px] tabular-nums ${mp.tertiary}`}>{pagination.total}개</span>
      </div>

      {/* 플레어 */}
      <div className="mb-4 flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => go({ flair: "", page: 1 })}
          className={!flair ? mp.pillActive : mp.pill}
        >
          전체 플레어
        </button>
        {THINK_FLAIRS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => go({ flair: f, page: 1 })}
            className={flair === f ? mp.pillActive : mp.pill}
          >
            {f}
          </button>
        ))}
      </div>

      <div className={`${mp.card} overflow-x-auto`}>
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-[rgba(244,241,234,0.12)] text-[10px] uppercase tracking-[0.14em] text-[#6e6b65]">
            <tr>
              <th className="w-16 px-4 py-3.5 font-medium">번호</th>
              <th className="px-4 py-3.5 font-medium">제목</th>
              <th className="w-28 px-4 py-3.5 font-medium">글쓴이</th>
              <th className="w-20 px-4 py-3.5 font-medium">작성일</th>
              <th className="w-14 px-4 py-3.5 text-right font-medium">조회</th>
              <th className="w-14 px-4 py-3.5 text-right font-medium">♥</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgba(244,241,234,0.08)]">
            {loading ? (
              <tr>
                <td colSpan={6} className={`px-4 py-16 text-center text-xs ${mp.muted}`}>
                  불러오는 중…
                </td>
              </tr>
            ) : loadError ? (
              <tr>
                <td colSpan={6} className="px-4 py-16 text-center text-xs text-rose-300">
                  {loadError}
                </td>
              </tr>
            ) : posts.length === 0 ? (
              <tr>
                <td colSpan={6} className={`px-4 py-16 text-center text-xs ${mp.muted}`}>
                  게시글이 없습니다.
                </td>
              </tr>
            ) : (
              posts.map((post, index) => {
                const displayNum =
                  pagination.total - (pagination.page - 1) * pagination.perPage - index;
                return (
                  <tr
                    key={post.id}
                    className="transition-colors hover:bg-[rgba(244,241,234,0.04)]"
                  >
                    <td className={`px-4 py-3.5 text-xs tabular-nums ${mp.tertiary}`}>
                      {post.is_notice ? (
                        <span className={`font-semibold ${mp.yellow}`}>공지</span>
                      ) : (
                        displayNum
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <Link
                        href={`/think/${post.id}`}
                        className="text-[14px] text-[#f4f1ea] transition hover:text-[#FBC201]"
                      >
                        {post.flair ? (
                          <span className={`mr-2 text-[10px] font-medium ${mp.yellow}`}>
                            [{post.flair}]
                          </span>
                        ) : null}
                        {post.title}
                        {(post.comment_count ?? 0) > 0 ? (
                          <span className={`ml-1.5 text-[11px] ${mp.tertiary}`}>
                            [{post.comment_count}]
                          </span>
                        ) : null}
                      </Link>
                    </td>
                    <td className={`max-w-[7rem] truncate px-4 py-3.5 text-xs ${mp.muted}`}>
                      {post.author_display}
                    </td>
                    <td className={`px-4 py-3.5 text-xs tabular-nums ${mp.muted}`}>
                      {formatThinkDate(post.created_at)}
                    </td>
                    <td className={`px-4 py-3.5 text-right text-xs tabular-nums ${mp.muted}`}>
                      {post.view_count}
                    </td>
                    <td className={`px-4 py-3.5 text-right text-xs tabular-nums ${mp.yellow}`}>
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
              onClick={() => go({ page: n })}
              className={`min-w-[2rem] rounded-[6px] px-2 py-1.5 text-xs ${
                n === pagination.page
                  ? "bg-[#f4f1ea] font-semibold text-[#0a0a0a]"
                  : `${mp.tertiary} hover:text-[#f4f1ea]`
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={handleSearch}
        className={`${mp.card} mt-8 flex flex-wrap items-center justify-center gap-2 px-4 py-4`}
      >
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="제목·내용 검색"
          className={`${mp.input} w-52 sm:w-80`}
        />
        <button type="submit" className={mp.creamBtn}>
          검색
        </button>
      </form>
    </div>
  );
}
