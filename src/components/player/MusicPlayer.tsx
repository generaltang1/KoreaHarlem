"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePlayer } from "@/context/PlayerContext";
import type { RepeatMode } from "@/lib/playerPreferences";
import {
  PlayerRepeatIcon,
  PlayerShuffleIcon,
  PlayerVolumeIcon,
  playerIconButtonClass,
} from "@/components/player/PlayerIcons";

function formatTime(sec: number) {
  if (!isFinite(sec) || isNaN(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function repeatAriaLabel(mode: RepeatMode): string {
  if (mode === "all") return "모두 반복";
  if (mode === "one") return "한 곡 반복";
  return "반복 끔 (앨범 종료 후 다른 앨범 재생)";
}

export function MusicPlayer() {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isShuffle,
    repeatMode,
    play,
    pause,
    seek,
    close,
    playNext,
    playPrev,
    hasNext,
    hasPrev,
    setVolume,
    toggleMute,
    toggleShuffle,
    cycleRepeat,
    audioRef,
  } = usePlayer();

  const prevTrackId = useRef<string | null>(null);
  const displayVolume = isMuted || volume <= 0 ? 0 : volume;

  useEffect(() => {
    if (!currentTrack) {
      prevTrackId.current = null;
      return;
    }
    if (!audioRef.current) return;
    if (prevTrackId.current !== currentTrack.id) {
      prevTrackId.current = currentTrack.id;
      audioRef.current.src = currentTrack.audio_url;
      audioRef.current.load();
      if (isPlaying) audioRef.current.play().catch(() => {});
    }
  }, [currentTrack, audioRef, isPlaying]);

  useEffect(() => {
    if (!audioRef.current || !currentTrack) return;
    if (isPlaying) {
      audioRef.current.play().catch(() => {});
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, audioRef, currentTrack]);

  if (!currentTrack) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const albumLink = currentTrack.albumId ? `/music/album/${currentTrack.albumId}` : null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-3 py-3 sm:px-4 md:px-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="hidden w-10 text-[10px] text-muted sm:block">{formatTime(currentTime)}</span>
          <div
            className="group relative h-1 flex-1 cursor-pointer bg-border"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const ratio = (e.clientX - rect.left) / rect.width;
              seek(ratio * duration);
            }}
          >
            <div className="h-full bg-foreground" style={{ width: `${progress}%` }} />
          </div>
          <span className="hidden w-10 text-right text-[10px] text-muted sm:block">
            {formatTime(duration)}
          </span>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
            <div className="h-9 w-9 flex-shrink-0 overflow-hidden bg-neutral-200 sm:h-10 sm:w-10">
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
            <div className="min-w-0">
              {albumLink ? (
                <Link href={albumLink} className="block truncate text-xs font-medium hover:underline">
                  {currentTrack.title}
                </Link>
              ) : (
                <p className="truncate text-xs font-medium">{currentTrack.title}</p>
              )}
              <p className="truncate text-[10px] text-muted">{currentTrack.artist}</p>
            </div>
          </div>

          <div className="flex items-center gap-0.5 sm:gap-1.5">
            <button
              onClick={playPrev}
              disabled={!hasPrev && currentTime <= 3}
              className="flex h-10 w-10 items-center justify-center transition-opacity hover:opacity-60 disabled:opacity-30 sm:h-11 sm:w-11"
              aria-label="이전 곡"
            >
              <svg width="18" height="18" viewBox="0 0 14 14" fill="currentColor">
                <path d="M2 2v10M11 3.5L5 7l6 3.5V3.5z" />
              </svg>
            </button>
            <button
              onClick={isPlaying ? pause : play}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-border transition-colors hover:bg-foreground hover:text-background sm:h-12 sm:w-12"
              aria-label={isPlaying ? "일시정지" : "재생"}
            >
              {isPlaying ? (
                <svg width="18" height="18" viewBox="0 0 14 14" fill="currentColor">
                  <rect x="2" y="1" width="4" height="12" rx="1" />
                  <rect x="8" y="1" width="4" height="12" rx="1" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 14 14" fill="currentColor">
                  <path d="M3 1.5l9 5.5-9 5.5V1.5z" />
                </svg>
              )}
            </button>
            <button
              onClick={playNext}
              disabled={!hasNext}
              className="flex h-10 w-10 items-center justify-center transition-opacity hover:opacity-60 disabled:opacity-30 sm:h-11 sm:w-11"
              aria-label="다음 곡"
            >
              <svg width="18" height="18" viewBox="0 0 14 14" fill="currentColor">
                <path d="M12 2v10M3 3.5L9 7 3 10.5V3.5z" />
              </svg>
            </button>
            <button
              type="button"
              onClick={cycleRepeat}
              className={playerIconButtonClass(repeatMode !== "off")}
              aria-label={repeatAriaLabel(repeatMode)}
              title={repeatAriaLabel(repeatMode)}
            >
              <PlayerRepeatIcon mode={repeatMode} />
            </button>
            <button
              type="button"
              onClick={toggleShuffle}
              className={playerIconButtonClass(isShuffle)}
              aria-label={isShuffle ? "셔플 끄기" : "셔플 켜기"}
              aria-pressed={isShuffle}
            >
              <PlayerShuffleIcon />
            </button>
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5">
            <button
              type="button"
              onClick={toggleMute}
              className={`${playerIconButtonClass(!isMuted && volume > 0)} shrink-0`}
              aria-label={isMuted || volume <= 0 ? "음소거 해제" : "음소거"}
            >
              <PlayerVolumeIcon muted={isMuted || volume <= 0} />
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={displayVolume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="h-1.5 w-14 cursor-pointer accent-foreground sm:w-20"
              aria-label="앱 음량 조절"
            />
            <button
              onClick={close}
              className="flex h-10 w-10 shrink-0 items-center justify-center transition-opacity hover:opacity-60 sm:h-11 sm:w-11"
              aria-label="재생 종료"
            >
              <svg width="18" height="18" viewBox="0 0 14 14" fill="none">
                <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
