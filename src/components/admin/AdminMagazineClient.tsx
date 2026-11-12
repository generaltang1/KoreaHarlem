"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AdminKpiRow, AdminPageHeader } from "@/components/admin/AdminPageHeader";
import {
  magazineCategoryLabel,
  magazineStatusLabel,
  type MagazinePost,
  type MagazineStatus,
} from "@/lib/magazine";

function toLocalInputValue(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function AdminMagazineClient() {
  const [posts, setPosts] = useState<MagazinePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [category, setCategory] = useState<"culture" | "news">("culture");
  const [showOnMusic, setShowOnMusic] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/magazine");
      const json = (await res.json()) as { posts?: MagazinePost[]; message?: string };
      if (!res.ok) throw new Error(json.message || "불러오기 실패");
      setPosts(json.posts ?? []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "오류");
      if (String(err).includes("magazine_posts") || String(err).includes("schema")) {
        setError("magazine_posts 테이블이 없습니다. supabase/add_admin_ops_features.sql 을 실행하세요.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const create = async (status: MagazineStatus) => {
    if (!title.trim()) {
      alert("제목을 입력하세요.");
      return;
    }
    if (status === "scheduled" && !scheduledAt) {
      alert("예약 발행 일시를 입력하세요.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/magazine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          excerpt,
          category,
          show_on_music: showOnMusic,
          status,
          content_html: `<p>${excerpt || title}</p>`,
          scheduled_at:
            status === "scheduled" ? new Date(scheduledAt).toISOString() : null,
        }),
      });
      const json = (await res.json()) as { message?: string };
      if (!res.ok) throw new Error(json.message || "저장 실패");
      setTitle("");
      setExcerpt("");
      setShowOnMusic(false);
      setScheduledAt("");
      await load();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "저장 실패");
    } finally {
      setSaving(false);
    }
  };

  const setStatus = async (id: string, status: MagazineStatus, scheduledIso?: string | null) => {
    const body: { status: MagazineStatus; scheduled_at?: string | null } = { status };
    if (status === "scheduled") {
      if (!scheduledIso) {
        alert("예약 발행 일시를 입력하세요.");
        return;
      }
      body.scheduled_at = new Date(scheduledIso).toISOString();
    } else {
      body.scheduled_at = null;
    }
    const res = await fetch(`/api/admin/magazine/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const json = (await res.json()) as { message?: string };
      alert(json.message || "변경 실패");
      return;
    }
    await load();
  };

  const saveScheduledAt = async (post: MagazinePost, localValue: string) => {
    if (!localValue) {
      alert("예약 일시를 입력하세요.");
      return;
    }
    const res = await fetch(`/api/admin/magazine/${post.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "scheduled",
        scheduled_at: new Date(localValue).toISOString(),
      }),
    });
    if (!res.ok) {
      const json = (await res.json()) as { message?: string };
      alert(json.message || "예약 저장 실패");
      return;
    }
    await load();
  };

  const toggleMusic = async (post: MagazinePost) => {
    await fetch(`/api/admin/magazine/${post.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ show_on_music: !post.show_on_music }),
    });
    await load();
  };

  const remove = async (id: string) => {
    if (!confirm("이 매거진 글을 삭제할까요?")) return;
    await fetch(`/api/admin/magazine/${id}`, { method: "DELETE" });
    await load();
  };

  const published = posts.filter((p) => p.status === "published").length;
  const drafts = posts.filter((p) => p.status === "draft").length;
  const scheduled = posts.filter((p) => p.status === "scheduled").length;
  const musicFlag = posts.filter((p) => p.show_on_music).length;

  return (
    <div>
      <AdminPageHeader
        title="매거진 관리"
        description="글 목록 · 발행/예약/임시저장 · MUSIC 표기"
      />

      <AdminKpiRow
        items={[
          { label: "발행", value: published },
          { label: "예약", value: scheduled },
          { label: "임시저장", value: drafts },
          { label: "MUSIC 표기", value: musicFlag },
        ]}
      />

      <section className="mb-8 rounded-lg border border-[#262626] bg-[#151515] p-5  ">
        <h2 className="mb-4 text-sm font-semibold">새 글 (빠른 등록)</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="제목"
            className="rounded-md border border-[#333] px-3 py-2 text-sm"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as "culture" | "news")}
            className="rounded-md border border-[#333] px-3 py-2 text-sm"
          >
            <option value="culture">Culture</option>
            <option value="news">News</option>
          </select>
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            placeholder="요약 / 본문 초안"
            rows={3}
            className="rounded-md border border-[#333] px-3 py-2 text-sm md:col-span-2"
          />
          <label className="flex items-center gap-2 text-sm md:col-span-2">
            <input
              type="checkbox"
              checked={showOnMusic}
              onChange={(e) => setShowOnMusic(e.target.checked)}
            />
            MUSIC에 표기
          </label>
          <label className="block text-xs text-[#6e6b65] md:col-span-2">
            예약 발행 일시 (예약 시 필요)
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="mt-1 w-full rounded-md border border-[#333] px-3 py-2 text-sm"
            />
          </label>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={saving}
            onClick={() => void create("draft")}
            className="rounded-md border border-[#333] px-4 py-2 text-xs uppercase tracking-widest"
          >
            임시저장
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => void create("scheduled")}
            className="rounded-md border border-neutral-900 px-4 py-2 text-xs uppercase tracking-widest"
          >
            예약 발행
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => void create("published")}
            className="rounded-md bg-[#f4f1ea] px-4 py-2 text-xs uppercase tracking-widest text-black"
          >
            바로 발행
          </button>
        </div>
      </section>

      {error ? <p className="mb-4 text-sm text-rose-600">{error}</p> : null}
      {loading ? (
        <p className="text-sm text-[#6e6b65]">불러오는 중…</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[#262626] bg-[#151515]">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-[#262626] bg-[#0c0c0c] text-[10px] uppercase tracking-widest text-[#6e6b65]">
              <tr>
                <th className="px-4 py-3">제목</th>
                <th className="px-4 py-3">분류</th>
                <th className="px-4 py-3">상태</th>
                <th className="px-4 py-3">예약</th>
                <th className="px-4 py-3">MUSIC</th>
                <th className="px-4 py-3">관리</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post.id} className="border-b border-[#262626]">
                  <td className="px-4 py-3">
                    <p className="font-medium">{post.title}</p>
                    <p className="text-xs text-[#6e6b65] line-clamp-1">{post.excerpt}</p>
                  </td>
                  <td className="px-4 py-3 text-xs">{magazineCategoryLabel(post.category)}</td>
                  <td className="px-4 py-3">
                    <select
                      className="rounded border border-[#333] px-2 py-1 text-xs"
                      value={post.status}
                      onChange={(e) => {
                        const next = e.target.value as MagazineStatus;
                        if (next === "scheduled") {
                          const local =
                            toLocalInputValue(post.scheduled_at) ||
                            toLocalInputValue(new Date(Date.now() + 3600_000).toISOString());
                          void setStatus(post.id, next, local);
                          return;
                        }
                        void setStatus(post.id, next, null);
                      }}
                    >
                      <option value="draft">임시저장</option>
                      <option value="scheduled">예약</option>
                      <option value="published">발행</option>
                      <option value="archived">보관</option>
                    </select>
                    <p className="mt-1 text-[10px] text-[#6e6b65]">
                      {magazineStatusLabel(post.status)}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    {post.status === "scheduled" ? (
                      <div className="flex flex-col gap-1">
                        <input
                          type="datetime-local"
                          defaultValue={toLocalInputValue(post.scheduled_at)}
                          className="rounded border border-[#333] px-2 py-1 text-xs"
                          onBlur={(e) => {
                            const v = e.target.value;
                            if (!v || v === toLocalInputValue(post.scheduled_at)) return;
                            void saveScheduledAt(post, v);
                          }}
                        />
                        <button
                          type="button"
                          className="self-start text-[10px] uppercase tracking-widest underline"
                          onClick={(e) => {
                            const input = (e.currentTarget.previousElementSibling ||
                              e.currentTarget.parentElement?.querySelector(
                                "input",
                              )) as HTMLInputElement | null;
                            if (input?.value) void saveScheduledAt(post, input.value);
                          }}
                        >
                          저장
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-[#6e6b65]">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button type="button" onClick={() => void toggleMusic(post)} className="text-xs underline">
                      {post.show_on_music ? "ON" : "OFF"}
                    </button>
                  </td>
                  <td className="px-4 py-3 space-x-3">
                    {post.status === "published" ? (
                      <Link
                        href={`/magazine/${post.category}`}
                        className="text-xs underline"
                      >
                        공개
                      </Link>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => void remove(post.id)}
                      className="text-xs text-rose-600 underline"
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {posts.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-[#6e6b65]">등록된 글이 없습니다.</p>
          ) : null}
        </div>
      )}
    </div>
  );
}
