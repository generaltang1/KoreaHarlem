"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatThinkDate, type ThinkPostListItem, type ThinkPostReport } from "@/lib/think";
import { AdminKpiRow, AdminPageHeader, AdminPrimaryButton } from "@/components/admin/AdminPageHeader";

type ReportRow = ThinkPostReport & {
  think_posts?: { id: string; title: string; is_hidden: boolean; author_nickname: string } | null;
};

export function AdminThinkList() {
  const [posts, setPosts] = useState<ThinkPostListItem[]>([]);
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"posts" | "reports">("posts");

  const load = async () => {
    setLoading(true);
    const [postsRes, reportsRes] = await Promise.all([
      fetch("/api/think/posts?tab=all&perPage=50&includeHidden=1"),
      fetch("/api/admin/think/reports"),
    ]);
    const postsJson = (await postsRes.json()) as { posts?: ThinkPostListItem[] };
    const reportsJson = (await reportsRes.json()) as { reports?: ReportRow[] };
    setPosts(postsJson.posts ?? []);
    setReports(reportsJson.reports ?? []);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const moderate = async (
    postId: string,
    body: Record<string, unknown>,
  ) => {
    const res = await fetch(`/api/admin/think/posts/${postId}/moderation`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const json = (await res.json()) as { message?: string };
      alert(json.message || "처리 실패");
      return;
    }
    await load();
  };

  const remove = async (id: string) => {
    if (!confirm("이 게시글을 삭제할까요?")) return;
    const res = await fetch(`/api/think/posts/${id}`, { method: "DELETE" });
    if (res.ok) setPosts((prev) => prev.filter((p) => p.id !== id));
    else alert("삭제에 실패했습니다.");
  };

  const openReports = reports.filter((r) => r.status === "open").length;
  const hiddenPosts = posts.filter((p) => p.is_hidden).length;

  return (
    <div>
      <AdminPageHeader
        title="THINK 게시판 관리"
        description="공지 · 개념글 · 신고 · 숨김 처리"
        actions={<AdminPrimaryButton href="/think/new">글쓰기 (공지 가능)</AdminPrimaryButton>}
      />

      <AdminKpiRow
        items={[
          { label: "전체 글", value: posts.length },
          { label: "숨김", value: hiddenPosts },
          { label: "열린 신고", value: openReports },
          { label: "신고 전체", value: reports.length },
        ]}
      />

      <div className="mb-4 flex gap-2">
        <button
          type="button"
          onClick={() => setTab("posts")}
          className={`rounded-md border px-3 py-1.5 text-xs uppercase tracking-widest ${
            tab === "posts" ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-300 bg-white"
          }`}
        >
          게시글
        </button>
        <button
          type="button"
          onClick={() => setTab("reports")}
          className={`rounded-md border px-3 py-1.5 text-xs uppercase tracking-widest ${
            tab === "reports" ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-300 bg-white"
          }`}
        >
          신고 {openReports ? `(${openReports})` : ""}
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-neutral-500">불러오는 중…</p>
      ) : tab === "posts" ? (
        <div className="space-y-3">
          {posts.length === 0 ? (
            <p className="text-sm text-neutral-500">게시글이 없습니다.</p>
          ) : (
            posts.map((post) => (
              <div
                key={post.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-neutral-200 bg-white p-4"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {post.is_notice && (
                      <span className="rounded bg-neutral-900 px-2 py-0.5 text-[10px] text-white">공지</span>
                    )}
                    {post.is_hidden && (
                      <span className="rounded bg-rose-100 px-2 py-0.5 text-[10px] text-rose-700">숨김</span>
                    )}
                    <Link href={`/think/${post.id}`} className="truncate text-sm font-medium hover:underline">
                      {post.title}
                    </Link>
                  </div>
                  <p className="mt-1 text-xs text-neutral-500">
                    {post.author_display} · {formatThinkDate(post.created_at)} · 추천{" "}
                    {post.recommend_count}
                  </p>
                </div>
                <div className="flex flex-wrap gap-3 text-xs">
                  <button
                    type="button"
                    onClick={() => void moderate(post.id, { is_notice: !post.is_notice })}
                    className="underline"
                  >
                    {post.is_notice ? "공지 해제" : "공지"}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      void moderate(post.id, {
                        is_hidden: !post.is_hidden,
                        hidden_reason: post.is_hidden ? "" : "관리자 숨김",
                      })
                    }
                    className="underline"
                  >
                    {post.is_hidden ? "숨김 해제" : "숨김"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void remove(post.id)}
                    className="text-rose-600 underline"
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-[10px] uppercase tracking-widest text-neutral-500">
              <tr>
                <th className="px-4 py-3">글</th>
                <th className="px-4 py-3">사유</th>
                <th className="px-4 py-3">상태</th>
                <th className="px-4 py-3">접수</th>
                <th className="px-4 py-3">처리</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => {
                const post = Array.isArray(r.think_posts) ? r.think_posts[0] : r.think_posts;
                return (
                  <tr key={r.id} className="border-b border-neutral-100">
                    <td className="px-4 py-3">
                      <Link href={`/think/${r.post_id}`} className="font-medium hover:underline">
                        {post?.title ?? r.post_id.slice(0, 8)}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-xs">{r.reason}</td>
                    <td className="px-4 py-3 text-xs">{r.status}</td>
                    <td className="px-4 py-3 text-xs text-neutral-500">
                      {new Date(r.created_at).toLocaleString("ko-KR")}
                    </td>
                    <td className="px-4 py-3 space-x-2 text-xs">
                      {r.status === "open" ? (
                        <>
                          <button
                            type="button"
                            className="underline"
                            onClick={() =>
                              void moderate(r.post_id, {
                                is_hidden: true,
                                hidden_reason: r.reason,
                                report_id: r.id,
                                report_status: "actioned",
                              })
                            }
                          >
                            숨김 처리
                          </button>
                          <button
                            type="button"
                            className="underline"
                            onClick={() =>
                              void moderate(r.post_id, {
                                report_id: r.id,
                                report_status: "dismissed",
                              })
                            }
                          >
                            기각
                          </button>
                        </>
                      ) : (
                        <span className="text-neutral-400">완료</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {reports.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-neutral-500">신고가 없습니다.</p>
          ) : null}
        </div>
      )}
    </div>
  );
}
