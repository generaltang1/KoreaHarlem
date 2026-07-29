"use client";

import Link from "next/link";
import Image from "next/image";
import type { Track } from "@/context/PlayerContext";

interface MusicCardProps {
  track: Track;
}

export function MusicCard({ track }: MusicCardProps) {
  return (
    <Link href={`/music/${track.id}`} className="group block">
      <div className="overflow-hidden border border-border bg-background transition-colors hover:border-foreground">
        <div className="relative aspect-[4/5] overflow-hidden bg-neutral-100">
          {track.cover_url ? (
            <Image
              src={track.cover_url}
              alt={track.title}
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
            {track.artist} - {track.title}
          </p>
          {track.description ? (
            <p className="line-clamp-2 text-xs leading-relaxed text-muted">
              {track.description}
            </p>
          ) : (
            <p className="text-xs text-muted">설명 없음</p>
          )}
        </div>
      </div>
    </Link>
  );
}
