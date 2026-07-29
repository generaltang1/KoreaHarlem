"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { usePlayer } from "@/context/PlayerContext";

function formatTime(sec: number) {
  if (!isFinite(sec) || isNaN(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function MusicPlayer() {
  const { currentTrack, isPlaying, currentTime, duration, play, pause, seek, audioRef } = usePlayer();
  const prevTrackId = useRef<string | null>(null);

  useEffect(() => {
    if (!currentTrack || !audioRef.current) return;
    if (prevTrackId.current !== currentTrack.id) {
      prevTrackId.current = currentTrack.id;
      audioRef.current.src = currentTrack.audio_url;
      audioRef.current.load();
      audioRef.current.play().catch(() => {});
    }
  }, [currentTrack, audioRef]);

  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.play().catch(() => {});
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, audioRef]);

  if (!currentTrack) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-sm">
      {/* 프로그레스 바 */}
      <div
        className="group relative h-1 w-full cursor-pointer bg-border"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const ratio = (e.clientX - rect.left) / rect.width;
          seek(ratio * duration);
        }}
      >
        <div
          className="h-full bg-foreground transition-none"
          style={{ width: `${progress}%` }}
        />
        <div
          className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-foreground opacity-0 shadow transition-opacity group-hover:opacity-100"
          style={{ left: `calc(${progress}% - 6px)` }}
        />
      </div>

      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 md:px-6">
        {/* 앨범 커버 */}
        <div className="h-10 w-10 flex-shrink-0 overflow-hidden bg-neutral-200">
          {currentTrack.cover_url ? (
            <Image
              src={currentTrack.cover_url}
              alt={currentTrack.title}
              width={40}
              height={40}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-neutral-800">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="white">
                <path d="M8 1a7 7 0 100 14A7 7 0 008 1zM6 5.5l5 2.5-5 2.5V5.5z" />
              </svg>
            </div>
          )}
        </div>

        {/* 트랙 정보 */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium">{currentTrack.title}</p>
          <p className="truncate text-[10px] text-muted">{currentTrack.artist}</p>
        </div>

        {/* 재생/일시정지 버튼 */}
        <button
          onClick={isPlaying ? pause : play}
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-border transition-colors hover:bg-foreground hover:text-background"
          aria-label={isPlaying ? "일시정지" : "재생"}
        >
          {isPlaying ? (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
              <rect x="2" y="1" width="4" height="12" rx="1" />
              <rect x="8" y="1" width="4" height="12" rx="1" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
              <path d="M3 1.5l9 5.5-9 5.5V1.5z" />
            </svg>
          )}
        </button>

        {/* 시간 */}
        <div className="hidden flex-shrink-0 text-[10px] text-muted sm:block">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      </div>
    </div>
  );
}
