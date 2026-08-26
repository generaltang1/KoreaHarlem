"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type TipListItem = {
  id: string;
  title: string;
  user_id: string | null;
  created_at: string;
  attachment_count: number;
};

export function AdminTipsList() {
  const router = useRouter();
  const [tips, setTips] = useState<TipListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/tips");
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "목록을 불러오지 못했습니다.");
      setTips(json.tips ?? []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "오류");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`"${title}" 제보를 삭제할까요?`)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/tips/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "삭제 실패");
      setTips((prev) => prev.filter((t) => t.id !== id));
      router.refresh();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "삭제 실패");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return <p className="text-sm text-muted">불러오는 중…</p>;
  if (error) {
    return (
      <div className="border border-border px-6 py-10 text-center">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }
  if (tips.length === 0) {
    return (
      <div className="border border-border px-6 py-10 text-center">
        <p className="text-sm text-muted">등록된 제보가 없습니다.</p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border border border-border">
      {tips.map((tip) => (
        <li key={tip.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <Link
              href={`/admin/tips/${tip.id}`}
              className="text-sm font-medium hover:underline"
            >
              {tip.title}
            </Link>
            <p className="mt-1 text-[10px] text-muted">
              {new Date(tip.created_at).toLocaleString("ko-KR")}
              {tip.user_id ? " · 회원" : " · 비회원"}
              {tip.attachment_count > 0 ? ` · 첨부 ${tip.attachment_count}` : ""}
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Link
              href={`/admin/tips/${tip.id}`}
              className="border border-border px-4 py-2 text-[10px] uppercase tracking-widest transition-colors hover:border-foreground"
            >
              상세
            </Link>
            <button
              type="button"
              disabled={deletingId === tip.id}
              onClick={() => void handleDelete(tip.id, tip.title)}
              className="border border-rose-200 px-4 py-2 text-[10px] uppercase tracking-widest text-rose-500 transition-colors hover:border-rose-500 disabled:opacity-50"
            >
              {deletingId === tip.id ? "삭제 중…" : "삭제"}
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
