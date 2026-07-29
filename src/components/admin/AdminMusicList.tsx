"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export interface AdminTrackItem {
  id: string;
  title: string;
  artist: string;
  created_at: string;
}

export function AdminMusicList({ tracks }: { tracks: AdminTrackItem[] }) {
  const router = useRouter();
  const supabase = createClient();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`"${title}" 곡을 삭제할까요?`)) return;

    setError("");
    setDeletingId(id);

    const { error: deleteError } = await supabase.from("tracks").delete().eq("id", id);
    setDeletingId(null);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    router.refresh();
  };

  if (tracks.length === 0) {
    return (
      <div className="border border-border p-8 text-center">
        <p className="text-sm text-muted">등록된 곡이 없습니다.</p>
        <Link
          href="/admin/music/new"
          className="mt-4 inline-block text-xs uppercase tracking-widest underline"
        >
          첫 곡 등록하기
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-xs text-rose-500">{error}</p>}
      {tracks.map((track) => (
        <div
          key={track.id}
          className="flex flex-col gap-3 border border-border p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{track.title}</p>
            <p className="truncate text-xs text-muted">{track.artist}</p>
            <p className="mt-1 text-[10px] text-muted">
              {new Date(track.created_at).toLocaleDateString("ko-KR")}
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Link
              href={`/admin/music/${track.id}/edit`}
              className="border border-border px-4 py-2 text-[10px] uppercase tracking-widest transition-colors hover:border-foreground"
            >
              수정
            </Link>
            <button
              type="button"
              onClick={() => handleDelete(track.id, track.title)}
              disabled={deletingId === track.id}
              className="border border-rose-200 px-4 py-2 text-[10px] uppercase tracking-widest text-rose-500 transition-colors hover:border-rose-500 disabled:opacity-50"
            >
              {deletingId === track.id ? "삭제 중..." : "삭제"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
