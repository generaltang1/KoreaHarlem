"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export interface AdminArtistItem {
  id: string;
  name: string;
  bio: string | null;
  image_url: string | null;
  created_at: string;
}

export function AdminArtistsList({ artists }: { artists: AdminArtistItem[] }) {
  const router = useRouter();
  const supabase = createClient();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`"${name}" 아티스트를 삭제할까요?`)) return;

    setError("");
    setDeletingId(id);

    const { error: deleteError } = await supabase.from("artists").delete().eq("id", id);
    setDeletingId(null);

    if (deleteError) {
      if (/foreign key|violates|restrict/i.test(deleteError.message)) {
        setError("이 아티스트에 연결된 앨범이 있어 삭제할 수 없습니다. 앨범을 먼저 삭제하거나 다른 아티스트로 변경해주세요.");
      } else {
        setError(deleteError.message);
      }
      return;
    }

    router.refresh();
  };

  if (artists.length === 0) {
    return (
      <div className="border border-border p-8 text-center">
        <p className="text-sm text-muted">등록된 아티스트가 없습니다.</p>
        <Link
          href="/admin/artists/new"
          className="mt-4 inline-block text-xs uppercase tracking-widest underline"
        >
          첫 아티스트 등록하기
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-xs text-rose-500">{error}</p>}
      {artists.map((artist) => (
        <div
          key={artist.id}
          className="flex flex-col gap-3 border border-border p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex min-w-0 items-center gap-4">
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-neutral-100">
              {artist.image_url ? (
                <Image src={artist.image_url} alt={artist.name} fill className="object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-muted">
                  <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
                    <circle cx="16" cy="12" r="6" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M4 28c0-6.627 5.373-12 12-12s12 5.373 12 12" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{artist.name}</p>
              {artist.bio ? (
                <p className="mt-0.5 line-clamp-1 text-xs text-muted">{artist.bio}</p>
              ) : (
                <p className="mt-0.5 text-xs text-muted">소개 없음</p>
              )}
              <p className="mt-1 text-[10px] text-muted">
                {new Date(artist.created_at).toLocaleDateString("ko-KR")}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <Link
              href={`/admin/artists/${artist.id}/edit`}
              className="border border-border px-4 py-2 text-[10px] uppercase tracking-widest transition-colors hover:border-foreground"
            >
              수정
            </Link>
            <button
              type="button"
              onClick={() => handleDelete(artist.id, artist.name)}
              disabled={deletingId === artist.id}
              className="border border-rose-200 px-4 py-2 text-[10px] uppercase tracking-widest text-rose-500 transition-colors hover:border-rose-500 disabled:opacity-50"
            >
              {deletingId === artist.id ? "삭제 중..." : "삭제"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
