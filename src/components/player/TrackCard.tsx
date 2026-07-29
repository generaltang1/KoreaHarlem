"use client";

import Image from "next/image";
import { usePlayer, type Track } from "@/context/PlayerContext";

interface TrackCardProps {
  track: Track;
}

export function TrackCard({ track }: TrackCardProps) {
  const { currentTrack, isPlaying, setTrack, pause, play } = usePlayer();
  const isActive = currentTrack?.id === track.id;

  const handleClick = () => {
    if (isActive) {
      if (isPlaying) {
        pause();
      } else {
        play();
      }
    } else {
      setTrack(track);
    }
  };

  return (
    <div className="group flex items-center gap-4 border-b border-border py-4 last:border-0">
      {/* 앨범 커버 */}
      <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden bg-neutral-100">
        {track.cover_url ? (
          <Image src={track.cover_url} alt={track.title} fill className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-neutral-800">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="white">
              <path d="M8 1a7 7 0 100 14A7 7 0 008 1zM6 5.5l5 2.5-5 2.5V5.5z" />
            </svg>
          </div>
        )}
        {/* 재생/일시정지 오버레이 */}
        <button
          onClick={handleClick}
          className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100"
          aria-label={isActive && isPlaying ? "일시정지" : "재생"}
        >
          {isActive && isPlaying ? (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="white">
              <rect x="1" y="0" width="3.5" height="12" rx="1" />
              <rect x="7.5" y="0" width="3.5" height="12" rx="1" />
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="white">
              <path d="M2 1l9 5-9 5V1z" />
            </svg>
          )}
        </button>
      </div>

      {/* 트랙 정보 */}
      <div className="min-w-0 flex-1">
        <p className={`truncate text-sm font-medium ${isActive ? "text-foreground" : ""}`}>
          {track.title}
        </p>
        <p className="truncate text-xs text-muted">{track.artist}</p>
      </div>

      {/* 재생 중 표시 */}
      {isActive && isPlaying && (
        <div className="flex flex-shrink-0 items-end gap-0.5">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="w-0.5 bg-foreground"
              style={{
                height: `${8 + i * 4}px`,
                animation: `pulse ${0.6 + i * 0.1}s ease-in-out infinite alternate`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
