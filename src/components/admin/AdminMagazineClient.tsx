"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AdminKpiRow, AdminPageHeader } from "@/components/admin/AdminPageHeader";
import {
  magazineCategoryLabel,
  magazinePublicPath,
  magazineStatusLabel,
  type MagazinePost,
  type MagazineStatus,
} from "@/lib/magazine";
import { adminLight } from "@/lib/siteTheme";

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
        setError(
          "magazine_posts 테이블이 없습니다. supabase/add_admin_ops_features.sql 및 add_magazine_blocks.sql 을 실행하세요.",
        );
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

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

  const toggleCover = async (post: MagazinePost) => {
    await fetch(`/api/admin/magazine/${post.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_cover_story: !post.is_cover_story }),
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
  const cover = posts.find((p) => p.is_cover_story);

  return (
    <div>
      <AdminPageHeader
        title="매거진 관리"
        description="블록 에디터 · 커버스토리 1개 · 해시태그 · MUSIC 표기 · 예약 발행"
      />

      <AdminKpiRow
        items={[
          { label: "발행", value: published },
          { label: "예약", value: scheduled },
          { label: "임시저장", value: drafts },
          { label: "MUSIC 표기", value: musicFlag },
        ]}
      />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className={`text-xs ${adminLight.muted}`}>
          커버스토리: {cover ? cover.title : "미지정"} (동시에 1개만)
        </p>
        <Link href="/admin/magazine/new" className={adminLight.btnAccent}>
          새 글 쓰기
        </Link>
      </div>

      {error ? <p className="mb-4 text-sm text-rose-600">{error}</p> : null}
      {loading ? (
        <p className={`text-sm ${adminLight.muted}`}>불러오는 중…</p>
      ) : (
        <div className={`overflow-x-auto ${adminLight.card}`}>
          <table className="min-w-full text-left text-sm">
            <thead className={adminLight.tableHead}>
              <tr>
                <th className="px-4 py-3">제목</th>
                <th className="px-4 py-3">분류</th>
                <th className="px-4 py-3">상태</th>
                <th className="px-4 py-3">예약</th>
                <th className="px-4 py-3">커버</th>
                <th className="px-4 py-3">MUSIC</th>
                <th className="px-4 py-3">관리</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post.id} className={adminLight.tableRow}>
                  <td className="px-4 py-3">
                    <p className="font-medium">{post.title}</p>
                    <p className={`line-clamp-1 text-xs ${adminLight.muted}`}>
                      {post.slug ? `/magazine/${post.slug}` : post.excerpt}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-xs">{magazineCategoryLabel(post.category)}</td>
                  <td className="px-4 py-3">
                    <select
                      className={adminLight.select}
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
                    <p className={`mt-1 text-[10px] ${adminLight.muted}`}>
                      {magazineStatusLabel(post.status)}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    {post.status === "scheduled" ? (
                      <div className="flex flex-col gap-1">
                        <input
                          type="datetime-local"
                          defaultValue={toLocalInputValue(post.scheduled_at)}
                          className={adminLight.input}
                          onBlur={(e) => {
                            const v = e.target.value;
                            if (!v || v === toLocalInputValue(post.scheduled_at)) return;
                            void saveScheduledAt(post, v);
                          }}
                        />
                      </div>
                    ) : (
                      <span className={`text-xs ${adminLight.muted}`}>—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button type="button" onClick={() => void toggleCover(post)} className="text-xs underline">
                      {post.is_cover_story ? "ON" : "OFF"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button type="button" onClick={() => void toggleMusic(post)} className="text-xs underline">
                      {post.show_on_music ? "ON" : "OFF"}
                    </button>
                  </td>
                  <td className="space-x-3 px-4 py-3">
                    <Link href={`/admin/magazine/${post.id}/edit`} className="text-xs underline">
                      편집
                    </Link>
                    {post.status === "published" ? (
                      <Link href={magazinePublicPath(post)} className="text-xs underline" target="_blank">
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
            <p className={`px-4 py-8 text-center text-sm ${adminLight.muted}`}>
              등록된 글이 없습니다. 「새 글 쓰기」로 시작하세요.
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
