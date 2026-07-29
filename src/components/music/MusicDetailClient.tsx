"use client";

import Link from "next/link";
import Image from "next/image";
import { usePlayer, type Track } from "@/context/PlayerContext";

interface MusicDetailClientProps {
  track: Track;
}

export function MusicDetailClient({ track }: MusicDetailClientProps) {
  const { currentTrack, isPlaying, setTrack, play, pause } = usePlayer();
  const isActive = currentTrack?.id === track.id;

  const handlePlay = () => {
    if (isActive) {
      if (isPlaying) pause();
      else play();
      return;
    }
    setTrack(track);
  };

  return (
    <article>
      <Link
        href="/works?category=music"
        className="mb-8 inline-flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted transition-colors hover:text-foreground"
      >
        ← 뒤로 가기
      </Link>

      <div className="mx-auto max-w-lg">
        <div className="relative mx-auto aspect-square w-full max-w-md overflow-hidden bg-neutral-100">
          {track.cover_url ? (
            <Image
              src={track.cover_url}
              alt={track.title}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-neutral-800">
              <svg width="48" height="48" viewBox="0 0 16 16" fill="white">
                <path d="M8 1a7 7 0 100 14A7 7 0 008 1zM6 5.5l5 2.5-5 2.5V5.5z" />
              </svg>
            </div>
          )}
        </div>

        <div className="mt-8">
          <p className="text-[10px] uppercase tracking-widest text-muted">Music</p>
          <h1 className="mt-2 text-2xl font-semibold leading-snug md:text-3xl">
            {track.title}
          </h1>
          <p className="mt-2 text-sm text-muted">{track.artist}</p>

          <button
            type="button"
            onClick={handlePlay}
            className="mt-6 inline-flex items-center gap-2 border border-border px-6 py-3 text-xs uppercase tracking-widest transition-colors hover:bg-foreground hover:text-background"
          >
            {isActive && isPlaying ? (
              <>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                  <rect x="1" y="0" width="3.5" height="12" rx="1" />
                  <rect x="7.5" y="0" width="3.5" height="12" rx="1" />
                </svg>
                일시정지
              </>
            ) : (
              <>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                  <path d="M2 1l9 5-9 5V1z" />
                </svg>
                재생
              </>
            )}
          </button>

          {track.description && (
            <div className="mt-10 border-t border-border pt-8">
              <p className="text-[10px] uppercase tracking-widest text-muted">설명</p>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                {track.description}
              </p>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
