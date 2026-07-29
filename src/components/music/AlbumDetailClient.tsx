"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePlayer } from "@/context/PlayerContext";
import type { AlbumWithTracks } from "@/lib/albums";
import { getAlbumArtistName, mapAlbumToPlayerTracks } from "@/lib/albums";

interface AlbumDetailClientProps {
  album: AlbumWithTracks;
}

function formatDuration(sec?: number | null) {
  if (!sec) return "--:--";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function AlbumDetailClient({ album }: AlbumDetailClientProps) {
  const { currentTrack, isPlaying, playQueue, play, pause } = usePlayer();
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(
    album.album_tracks[0]?.id ?? null,
  );

  const playerTracks = mapAlbumToPlayerTracks(album);
  const sortedTracks = [...album.album_tracks].sort((a, b) => a.track_order - b.track_order);
  const selectedTrack = sortedTracks.find((t) => t.id === selectedTrackId) ?? sortedTracks[0];
  const artist = getAlbumArtistName(album);

  const handlePlayTrack = (trackId: string) => {
    const index = playerTracks.findIndex((t) => t.id === trackId);
    if (index < 0) return;

    setSelectedTrackId(trackId);

    if (currentTrack?.id === trackId) {
      if (isPlaying) pause();
      else play();
      return;
    }

    playQueue(playerTracks, index);
  };

  const isAlbumQueueActive =
    currentTrack?.albumId === album.id && playerTracks.some((t) => t.id === currentTrack.id);

  return (
    <article>
      <Link
        href="/works?category=music"
        className="mb-8 inline-flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted transition-colors hover:text-foreground"
      >
        ← 뒤로 가기
      </Link>

      <div className="grid gap-8 md:grid-cols-[280px_1fr]">
        <div className="relative mx-auto aspect-square w-full max-w-[280px] overflow-hidden bg-neutral-100">
          {album.cover_url ? (
            <Image src={album.cover_url} alt={album.title} fill className="object-cover" priority />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-neutral-800">
              <svg width="48" height="48" viewBox="0 0 16 16" fill="white">
                <path d="M8 1a7 7 0 100 14A7 7 0 008 1zM6 5.5l5 2.5-5 2.5V5.5z" />
              </svg>
            </div>
          )}
        </div>

        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted">Album</p>
          <h1 className="mt-2 text-2xl font-semibold leading-snug md:text-3xl">{album.title}</h1>
          <p className="mt-2 text-sm text-muted">{artist}</p>
          <p className="mt-1 text-[10px] uppercase tracking-widest text-muted">
            {sortedTracks.length} tracks
          </p>

          {album.description && (
            <div className="mt-6">
              <p className="text-[10px] uppercase tracking-widest text-muted">앨범 설명</p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                {album.description}
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              if (sortedTracks[0]) handlePlayTrack(sortedTracks[0].id);
            }}
            className="mt-6 inline-flex items-center gap-2 border border-border px-6 py-3 text-xs uppercase tracking-widest transition-colors hover:bg-foreground hover:text-background"
          >
            ▶ 앨범 재생
          </button>
        </div>
      </div>

      <div className="mt-12">
        <p className="mb-4 text-[10px] uppercase tracking-widest text-muted">수록곡</p>
        <div className="divide-y divide-border border border-border">
          {sortedTracks.map((track, index) => {
            const isActive = isAlbumQueueActive && currentTrack?.id === track.id;
            const isSelected = selectedTrack?.id === track.id;

            return (
              <button
                key={track.id}
                type="button"
                onClick={() => handlePlayTrack(track.id)}
                className={`flex w-full items-center gap-4 px-4 py-3 text-left transition-colors hover:bg-neutral-50 ${
                  isActive ? "bg-neutral-100" : isSelected ? "bg-neutral-50/80" : ""
                }`}
              >
                <span className="w-6 text-xs text-muted">{index + 1}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className={`truncate text-sm ${isActive ? "font-semibold" : "font-medium"}`}>
                      {track.title}
                    </p>
                    {track.is_title_track && (
                      <span className="shrink-0 border border-border px-1.5 py-0.5 text-[9px] uppercase tracking-widest text-muted">
                        Title
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-[10px] text-muted">{formatDuration(track.duration)}</span>
                <span className="text-[10px] uppercase tracking-widest text-muted">
                  {isActive && isPlaying ? "Playing" : "Play"}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {selectedTrack && (
        <div className="mt-8 border border-border p-8 md:p-10">
          <p className="text-[10px] uppercase tracking-widest text-muted">곡 설명</p>
          <h2 className="mt-2 text-lg font-semibold md:text-xl">{selectedTrack.title}</h2>
          <p className="mt-4 min-h-[120px] whitespace-pre-wrap text-base leading-relaxed text-foreground/90 md:text-[15px]">
            {selectedTrack.description || "이 곡에 대한 설명이 없습니다."}
          </p>
        </div>
      )}
    </article>
  );
}
