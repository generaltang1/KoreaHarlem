"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePlayer } from "@/context/PlayerContext";
import { useDjSet } from "@/context/DjSetContext";
import type { RepeatMode } from "@/lib/playerPreferences";
import { useSupportsAppVolume } from "@/hooks/useSupportsAppVolume";
import {
  PlayerRepeatIcon,
  PlayerShuffleIcon,
  PlayerVolumeIcon,
} from "@/components/player/PlayerIcons";

function formatTime(sec: number) {
  if (!Number.isFinite(sec) || Number.isNaN(sec) || sec < 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function repeatAriaLabel(mode: RepeatMode): string {
  if (mode === "all") return "모두 반복";
  if (mode === "one") return "한 곡 반복";
  return "반복 끔 (앨범 종료 후 다른 앨범 재생)";
}

/** I-06 하단 음악 플레이어 — PC 긴 바 / 모바일 작은 바. 곡설명·가사 패널 없음. */
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
  const { isPlaying: djPlaying } = useDjSet();

  const supportsAppVolume = useSupportsAppVolume();
  const prevTrackId = useRef<string | null>(null);
  const countedPlayIds = useRef<Set<string>>(new Set());
  const displayVolume = isMuted || volume <= 0 ? 0 : volume;
  const progress = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

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
      if (!countedPlayIds.current.has(currentTrack.id)) {
        countedPlayIds.current.add(currentTrack.id);
        void fetch(`/api/music/tracks/${currentTrack.id}/play`, { method: "POST" }).catch(
          () => {},
        );
      }
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

  if (!currentTrack || djPlaying) return null;

  const albumLink = currentTrack.albumId ? `/music/album/${currentTrack.albumId}` : null;

  const seekFromClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (duration <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    seek(ratio * duration);
  };

  const cover = (
    <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-[8px] bg-[rgba(244,241,234,0.08)] sm:h-[52px] sm:w-[52px]">
      {currentTrack.cover_url ? (
        <Image
          src={currentTrack.cover_url}
          alt=""
          fill
          className="object-cover"
          sizes="52px"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-[10px] text-neutral-500">
          KH
        </div>
      )}
    </div>
  );

  const titleBlock = (
    <div className="min-w-0 flex-1">
      {albumLink ? (
        <Link
          href={albumLink}
          className="block truncate text-[13px] font-medium text-[#f4f1ea] hover:underline"
        >
          {currentTrack.title}
        </Link>
      ) : (
        <p className="truncate text-[13px] font-medium text-[#f4f1ea]">{currentTrack.title}</p>
      )}
      <p className="truncate text-[11px] text-[#a8a49b]">
        {currentTrack.artist || "koreaharlem"}
      </p>
    </div>
  );

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-[rgba(244,241,234,0.12)] bg-[rgba(10,10,10,0.85)] text-[#f4f1ea] backdrop-blur-[10px] [font-family:var(--font-f-sans),var(--font-geist-sans),sans-serif]">
      {/* 모바일: 작은 바 (시안 Mobile 390) */}
      <div className="md:hidden">
        <button
          type="button"
          className="block h-[3px] w-full bg-[rgba(244,241,234,0.12)]"
          aria-label="재생 위치"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            if (duration <= 0) return;
            const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            seek(ratio * duration);
          }}
        >
          <span
            className="block h-full bg-[#f4f1ea]"
            style={{ width: `${progress}%` }}
          />
        </button>
        <div className="flex h-16 items-center gap-3 px-3">
          {cover}
          {titleBlock}
          <button
            type="button"
            onClick={playPrev}
            disabled={!hasPrev && currentTime <= 3}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] text-[#f4f1ea] disabled:opacity-30"
            aria-label="이전 곡"
          >
            <svg width="18" height="18" viewBox="0 0 14 14" fill="currentColor">
              <path d="M2 2v10M11 3.5L5 7l6 3.5V3.5z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={isPlaying ? pause : play}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f4f1ea] text-black"
            aria-label={isPlaying ? "일시정지" : "재생"}
          >
            {isPlaying ? (
              <span className="text-[10px] leading-none">❚❚</span>
            ) : (
              <span className="ml-0.5 text-[10px] leading-none">▶</span>
            )}
          </button>
          <button
            type="button"
            onClick={playNext}
            disabled={!hasNext}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] text-[#f4f1ea] disabled:opacity-30"
            aria-label="다음 곡"
          >
            <svg width="18" height="18" viewBox="0 0 14 14" fill="currentColor">
              <path d="M12 2v10M3 3.5L9 7 3 10.5V3.5z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Desktop: 긴 바 (시안 Desktop) — 가사/곡설명 없음 */}
      <div className="mx-auto hidden h-20 max-w-[1720px] items-center gap-4 px-6 md:flex">
        <div className="flex w-[300px] shrink-0 items-center gap-4">
          {cover}
          {titleBlock}
        </div>

        <div className="flex min-w-0 flex-1 flex-col items-center justify-center gap-1.5">
          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={toggleShuffle}
              className={`flex h-8 w-8 items-center justify-center rounded-[8px] transition-colors hover:bg-[rgba(244,241,234,0.06)] ${
                isShuffle ? "text-[#FEE500]" : "text-[#a8a49b] hover:text-white"
              }`}
              aria-label={isShuffle ? "셔플 끄기" : "셔플 켜기"}
              aria-pressed={isShuffle}
            >
              <PlayerShuffleIcon />
            </button>
            <button
              type="button"
              onClick={playPrev}
              disabled={!hasPrev && currentTime <= 3}
              className="flex h-8 w-8 items-center justify-center rounded-[8px] transition-colors hover:bg-[rgba(244,241,234,0.06)] text-[#f4f1ea] disabled:opacity-30"
              aria-label="이전 곡"
            >
              <svg width="18" height="18" viewBox="0 0 14 14" fill="currentColor">
                <path d="M2 2v10M11 3.5L5 7l6 3.5V3.5z" />
              </svg>
            </button>
            <button
              type="button"
              onClick={isPlaying ? pause : play}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f4f1ea] text-black"
              aria-label={isPlaying ? "일시정지" : "재생"}
            >
              {isPlaying ? (
                <span className="text-[11px] leading-none">❚❚</span>
              ) : (
                <span className="ml-0.5 text-[11px] leading-none">▶</span>
              )}
            </button>
            <button
              type="button"
              onClick={playNext}
              disabled={!hasNext}
              className="flex h-8 w-8 items-center justify-center rounded-[8px] transition-colors hover:bg-[rgba(244,241,234,0.06)] text-[#f4f1ea] disabled:opacity-30"
              aria-label="다음 곡"
            >
              <svg width="18" height="18" viewBox="0 0 14 14" fill="currentColor">
                <path d="M12 2v10M3 3.5L9 7 3 10.5V3.5z" />
              </svg>
            </button>
            <button
              type="button"
              onClick={cycleRepeat}
              className={`flex h-8 w-8 items-center justify-center rounded-[8px] transition-colors hover:bg-[rgba(244,241,234,0.06)] ${
                repeatMode !== "off" ? "text-[#FEE500]" : "text-[#a8a49b] hover:text-white"
              }`}
              aria-label={repeatAriaLabel(repeatMode)}
              title={repeatAriaLabel(repeatMode)}
            >
              <PlayerRepeatIcon mode={repeatMode} />
            </button>
          </div>
          <div className="flex w-full max-w-[520px] items-center gap-2">
            <span className="w-10 shrink-0 text-right font-mono text-[10px] tabular-nums text-[#a8a49b]">
              {formatTime(currentTime)}
            </span>
            <div
              role="slider"
              aria-label="재생 위치"
              aria-valuemin={0}
              aria-valuemax={duration || 0}
              aria-valuenow={currentTime}
              className="group relative h-3 flex-1 cursor-pointer py-1"
              onClick={seekFromClick}
            >
              <div className="h-[3px] overflow-hidden rounded-full bg-[rgba(244,241,234,0.12)]">
                <div
                  className="h-full rounded-full bg-[#f4f1ea]"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            <span className="w-10 shrink-0 font-mono text-[10px] tabular-nums text-[#a8a49b]">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        <div className="flex w-[300px] shrink-0 items-center justify-end gap-2">
          {supportsAppVolume && (
            <>
              <button
                type="button"
                onClick={toggleMute}
                className="flex h-8 w-8 items-center justify-center rounded-[8px] transition-colors hover:bg-[rgba(244,241,234,0.06)] text-[#a8a49b] hover:text-white"
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
                className="h-[3px] w-20 cursor-pointer appearance-none rounded-full bg-[rgba(244,241,234,0.12)] accent-[#f4f1ea]"
                aria-label="음량"
              />
            </>
          )}
          <button
            type="button"
            onClick={close}
            className="ml-2 flex h-8 w-8 items-center justify-center rounded-[8px] transition-colors hover:bg-[rgba(244,241,234,0.06)] text-[#a8a49b] hover:text-white"
            aria-label="재생 종료"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
