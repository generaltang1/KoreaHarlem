"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { writeAdminAudit } from "@/lib/adminAudit";
import type { AlbumPublishStatus } from "@/lib/albumPublish";
import { createClient } from "@/lib/supabase/client";

export interface AdminAlbumItem {
  id: string;
  title: string;
  artist: string;
  track_count: number;
  created_at: string;
  album_type?: string | null;
  album_type_label?: string;
  release_date?: string | null;
  publish_status?: AlbumPublishStatus;
  publish_status_label?: string;
  play_count?: number;
  download_count?: number;
  scheduled_publish_at?: string | null;
}

function PublishBadge({ status }: { status?: AlbumPublishStatus }) {
  const label =
    status === "public" ? "공개" : status === "scheduled" ? "예약" : "비공개";
  const className =
    status === "public"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : status === "scheduled"
        ? "border-amber-200 bg-amber-50 text-amber-900"
        : "border-[#262626] bg-[#0c0c0c] text-[#a8a49b]";
  return (
    <span
      className={`inline-flex shrink-0 items-center border px-2 py-0.5 text-[10px] font-medium uppercase tracking-widest ${className}`}
    >
      {label}
    </span>
  );
}

export function AdminMusicList({ albums }: { albums: AdminAlbumItem[] }) {
  const router = useRouter();
  const supabase = createClient();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`"${title}" 앨범을 삭제할까요? 수록곡도 함께 삭제됩니다.`)) return;

    setError("");
    setDeletingId(id);

    const { error: deleteError } = await supabase.from("albums").delete().eq("id", id);
    setDeletingId(null);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    await writeAdminAudit({
      module: "music",
      action: "delete",
      targetType: "album",
      targetId: id,
      summary: `앨범 삭제: ${title}`,
    });

    router.refresh();
  };

  if (albums.length === 0) {
    return (
      <div className="border border-border p-8 text-center">
        <p className="text-sm text-muted">등록된 앨범이 없습니다.</p>
        <Link
          href="/admin/music/new"
          className="mt-4 inline-block text-xs uppercase tracking-widest underline"
        >
          첫 앨범 등록하기
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-xs text-rose-500">{error}</p>}
      {albums.map((album) => (
        <div
          key={album.id}
          className="flex flex-col gap-3 border border-border p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-sm font-medium">{album.title}</p>
              <PublishBadge status={album.publish_status} />
              {album.album_type_label && album.album_type_label !== "—" ? (
                <span className="text-[10px] uppercase tracking-widest text-muted">
                  {album.album_type_label}
                </span>
              ) : null}
            </div>
            <p className="truncate text-xs text-muted">{album.artist}</p>
            <p className="mt-1 text-[10px] text-muted">
              {album.track_count} tracks
              {album.release_date
                ? ` · 발매 ${new Date(album.release_date).toLocaleDateString("ko-KR")}`
                : ` · ${new Date(album.created_at).toLocaleDateString("ko-KR")}`}
              {album.publish_status === "scheduled" && album.scheduled_publish_at
                ? ` · 예약 ${new Date(album.scheduled_publish_at).toLocaleString("ko-KR")}`
                : ""}
              {` · ▶ ${album.play_count ?? 0} · ↓ ${album.download_count ?? 0}`}
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Link
              href={`/admin/music/${album.id}/edit`}
              className="border border-border px-4 py-2 text-[10px] uppercase tracking-widest transition-colors hover:border-foreground"
            >
              수정
            </Link>
            <button
              type="button"
              onClick={() => handleDelete(album.id, album.title)}
              disabled={deletingId === album.id}
              className="border border-rose-200 px-4 py-2 text-[10px] uppercase tracking-widest text-rose-500 transition-colors hover:border-rose-500 disabled:opacity-50"
            >
              {deletingId === album.id ? "삭제 중..." : "삭제"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
