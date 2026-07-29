"use client";

import Link from "next/link";
import Image from "next/image";
import type { DbAlbum } from "@/lib/albums";
import { getAlbumArtistName } from "@/lib/albums";

interface AlbumCardProps {
  album: DbAlbum & { track_count?: number };
}

export function AlbumCard({ album }: AlbumCardProps) {
  const artist = getAlbumArtistName(album);

  return (
    <Link href={`/music/album/${album.id}`} className="group block">
      <div className="overflow-hidden border border-border bg-background transition-colors hover:border-foreground">
        <div className="relative aspect-[4/5] overflow-hidden bg-neutral-100">
          {album.cover_url ? (
            <Image
              src={album.cover_url}
              alt={album.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-neutral-800">
              <svg width="32" height="32" viewBox="0 0 16 16" fill="white">
                <path d="M8 1a7 7 0 100 14A7 7 0 008 1zM6 5.5l5 2.5-5 2.5V5.5z" />
              </svg>
            </div>
          )}
        </div>
        <div className="space-y-1.5 p-4">
          <p className="truncate text-sm font-semibold">
            {artist} - {album.title}
          </p>
          {album.description ? (
            <p className="line-clamp-2 text-xs leading-relaxed text-muted">
              {album.description}
            </p>
          ) : (
            <p className="text-xs text-muted">설명 없음</p>
          )}
          {album.track_count !== undefined && (
            <p className="text-[10px] uppercase tracking-widest text-muted">
              {album.track_count} tracks
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
