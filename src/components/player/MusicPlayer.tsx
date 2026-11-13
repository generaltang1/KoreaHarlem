"use client";

import { useEffect, useRef, useState } from "react";
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
  if (!Number.isFinite(sec) || Number.isNaN(sec) || sec < 0) return "00:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function repeatAriaLabel(mode: RepeatMode): string {
  if (mode === "all") return "모두 반복";
  if (mode === "one") return "한 곡 반복";
  return "반복 끔 (앨범 종료 후 다른 앨범 재생)";
}

function LyricsIcon({ className = "" }: { className?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden className={className}>
      <path
        d="M3.5 4.5h11M3.5 9h8M3.5 13.5h5.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CloseIcon({ className = "" }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden className={className}>
      <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

/**
 * I-06 하단 음악 플레이어 — Figma `314:461` Desktop / `314:501` Mobile.
 * 가사·곡설명 패널은 아이콘만 시안 배치(패널 본문은 추후). 풀스크린 확장은 대기.
 */
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
  const [lyricsHint, setLyricsHint] = useState(false);
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
  const subtitle = currentTrack.albumTitle
    ? `${currentTrack.artist || "koreaharlem"} · 《${currentTrack.albumTitle}》`
    : currentTrack.artist || "koreaharlem";

  const seekFromClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (duration <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    seek(ratio * duration);
  };

  const cover = (
    <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-[4px] bg-[rgba(244,241,234,0.08)] sm:h-[52px] sm:w-[52px]">
      {currentTrack.cover_url ? (
        <Image
          src={currentTrack.cover_url}
          alt=""
          fill
          className="object-cover"
          sizes="52px"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-[10px] text-[#6e6b65]">
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
      <p className="truncate text-[11px] text-[#a8a49b]">{subtitle}</p>
    </div>
  );

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-[rgba(244,241,234,0.12)] bg-[rgba(21,21,21,0.92)] text-[#f4f1ea] backdrop-blur-[10px] [font-family:var(--font-f-sans),var(--font-geist-sans),sans-serif]">
      {/* Mobile 390 — Figma 314:501 */}
      <div className="md:hidden">
        <button
          type="button"
          className="block h-[3px] w-full bg-[rgba(244,241,234,0.15)]"
          aria-label="재생 위치"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            if (duration <= 0) return;
            const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            seek(ratio * duration);
          }}
        >
          <span className="block h-full rounded-[2px] bg-[#f4f1ea]" style={{ width: `${progress}%` }} />
        </button>
        <div className="flex h-16 items-center gap-3 px-3">
          {cover}
          {titleBlock}
          <button
            type="button"
            onClick={playPrev}
            disabled={!hasPrev && currentTime <= 3}
            className="flex h-9 w-9 shrink-0 items-center justify-center text-[#f4f1ea] disabled:opacity-30"
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
            className="flex h-9 w-9 shrink-0 items-center justify-center text-[#f4f1ea] disabled:opacity-30"
            aria-label="다음 곡"
          >
            <svg width="18" height="18" viewBox="0 0 14 14" fill="currentColor">
              <path d="M12 2v10M3 3.5L9 7 3 10.5V3.5z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Desktop — Figma 314:461 */}
      <div className="mx-auto hidden h-20 max-w-[1280px] items-center gap-6 px-6 md:flex">
        <div className="flex h-14 w-[300px] shrink-0 items-center gap-3">
          {cover}
          {titleBlock}
        </div>

        <div className="flex min-w-0 flex-1 flex-col items-center justify-center gap-2">
          <div className="flex items-center gap-[22px]">
            <button
              type="button"
              onClick={toggleShuffle}
              className={`flex size-4 items-center justify-center transition-colors ${
                isShuffle ? "text-[#FBC201]" : "text-[#a8a49b] hover:text-[#f4f1ea]"
              }`}
              aria-label={isShuffle ? "셔플 끄기" : "셔플 켜기"}
              aria-pressed={isShuffle}
            >
              <PlayerShuffleIcon className="!h-4 !w-4" />
            </button>
            <button
              type="button"
              onClick={playPrev}
              disabled={!hasPrev && currentTime <= 3}
              className="flex size-[18px] items-center justify-center text-[#f4f1ea] disabled:opacity-30"
              aria-label="이전 곡"
            >
              <svg width="18" height="18" viewBox="0 0 14 14" fill="currentColor">
                <path d="M2 2v10M11 3.5L5 7l6 3.5V3.5z" />
              </svg>
            </button>
            <button
              type="button"
              onClick={isPlaying ? pause : play}
              className="flex size-9 items-center justify-center rounded-full bg-[#f4f1ea] text-black"
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
              className="flex size-[18px] items-center justify-center text-[#f4f1ea] disabled:opacity-30"
              aria-label="다음 곡"
            >
              <svg width="18" height="18" viewBox="0 0 14 14" fill="currentColor">
                <path d="M12 2v10M3 3.5L9 7 3 10.5V3.5z" />
              </svg>
            </button>
            <button
              type="button"
              onClick={cycleRepeat}
              className={`flex size-4 items-center justify-center transition-colors ${
                repeatMode !== "off" ? "text-[#FBC201]" : "text-[#a8a49b] hover:text-[#f4f1ea]"
              }`}
              aria-label={repeatAriaLabel(repeatMode)}
              title={repeatAriaLabel(repeatMode)}
            >
              <PlayerRepeatIcon mode={repeatMode} className="!h-4 !w-4" />
            </button>
          </div>
          <div className="flex w-full max-w-[506px] items-center gap-2.5">
            <span className="w-[33px] shrink-0 text-right font-mono text-[10px] tabular-nums text-[#6e6b65]">
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
              <div className="h-[3px] overflow-hidden rounded-[2px] bg-[rgba(244,241,234,0.15)]">
                <div
                  className="h-full rounded-[2px] bg-[#f4f1ea]"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            <span className="w-[33px] shrink-0 font-mono text-[10px] tabular-nums text-[#6e6b65]">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        <div className="relative flex h-10 w-[300px] shrink-0 items-center justify-end gap-4">
          <button
            type="button"
            onClick={() => {
              setLyricsHint(true);
              window.setTimeout(() => setLyricsHint(false), 2200);
            }}
            className="flex size-[18px] items-center justify-center text-[#a8a49b] transition hover:text-[#f4f1ea]"
            aria-label="가사 · 곡설명 (준비 중)"
            title="가사 · 곡설명 — 추후"
          >
            <LyricsIcon />
          </button>
          {supportsAppVolume && (
            <>
              <button
                type="button"
                onClick={toggleMute}
                className="flex size-[18px] items-center justify-center text-[#a8a49b] transition hover:text-[#f4f1ea]"
                aria-label={isMuted || volume <= 0 ? "음소거 해제" : "음소거"}
              >
                <PlayerVolumeIcon muted={isMuted || volume <= 0} className="!h-[18px] !w-[18px]" />
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={displayVolume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="h-[3px] w-20 cursor-pointer appearance-none rounded-[2px] bg-[rgba(244,241,234,0.15)] accent-[#6e6b65]"
                aria-label="음량"
              />
            </>
          )}
          <button
            type="button"
            onClick={close}
            className="flex size-4 items-center justify-center text-[#a8a49b] transition hover:text-[#f4f1ea]"
            aria-label="재생 종료"
          >
            <CloseIcon />
          </button>
          {lyricsHint && (
            <p className="absolute bottom-full right-0 mb-2 rounded-[8px] border border-[rgba(244,241,234,0.12)] bg-[#151515] px-3 py-2 text-[11px] text-[#a8a49b] shadow-lg">
              가사 · 곡설명 패널은 추후 적용됩니다
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
