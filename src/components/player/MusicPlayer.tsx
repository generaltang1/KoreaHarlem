"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePlayer } from "@/context/PlayerContext";

function formatTime(sec: number) {
  if (!isFinite(sec) || isNaN(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function VolumeIcon({ muted, level }: { muted: boolean; level: number }) {
  if (muted || level === 0) {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
        <path d="M3 6.5h2l3-2.5v9l-3-2.5H3v-4z" stroke="currentColor" strokeWidth="1.2" />
        <path d="M12 5.5l-4 4M8 5.5l4 4" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    );
  }

  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M3 6.5h2l3-2.5v9l-3-2.5H3v-4z" stroke="currentColor" strokeWidth="1.2" />
      <path d="M11 5.5c1.2 1.2 1.2 3.8 0 5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M12.5 4c2 2 2 6 0 8" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

export function MusicPlayer() {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    play,
    pause,
    seek,
    close,
    playNext,
    playPrev,
    hasNext,
    hasPrev,
    audioRef,
  } = usePlayer();

  const prevTrackId = useRef<string | null>(null);
  const volumeBeforeMute = useRef(0.7);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);

  const displayVolume = isMuted ? 0 : volume;
  const effectiveVolume = isMuted ? 0 : volume;

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

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = effectiveVolume;
  }, [effectiveVolume, audioRef, currentTrack]);

  const handleVolumeChange = (value: number) => {
    if (value <= 0) {
      if (!isMuted && volume > 0) volumeBeforeMute.current = volume;
      setVolume(0);
      setIsMuted(true);
      return;
    }
    volumeBeforeMute.current = value;
    setVolume(value);
    setIsMuted(false);
  };

  const toggleMute = () => {
    if (isMuted || volume === 0) {
      const restored = volumeBeforeMute.current > 0 ? volumeBeforeMute.current : 0.7;
      setVolume(restored);
      setIsMuted(false);
      return;
    }
    volumeBeforeMute.current = volume;
    setIsMuted(true);
  };

  if (!currentTrack) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const albumLink = currentTrack.albumId ? `/music/album/${currentTrack.albumId}` : null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-3 md:px-6">
        {/* 진행 바 + 시간 */}
        <div className="flex items-center gap-3">
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
          <span className="hidden w-10 text-right text-[10px] text-muted sm:block">{formatTime(duration)}</span>
        </div>

        <div className="flex items-center gap-3 md:gap-4">
          {/* 현재 곡 정보 */}
          <div className="flex min-w-0 flex-1 items-center gap-3">
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

          {/* 재생 컨트롤 */}
          <div className="flex items-center gap-2 md:gap-3">
            <button
              onClick={playPrev}
              disabled={!hasPrev && currentTime <= 3}
              className="flex h-8 w-8 items-center justify-center transition-opacity hover:opacity-60 disabled:opacity-30"
              aria-label="이전 곡"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                <path d="M2 2v10M11 3.5L5 7l6 3.5V3.5z" />
              </svg>
            </button>
            <button
              onClick={isPlaying ? pause : play}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border transition-colors hover:bg-foreground hover:text-background"
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
            <button
              onClick={playNext}
              disabled={!hasNext}
              className="flex h-8 w-8 items-center justify-center transition-opacity hover:opacity-60 disabled:opacity-30"
              aria-label="다음 곡"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                <path d="M12 2v10M3 3.5L9 7 3 10.5V3.5z" />
              </svg>
            </button>
          </div>

          {/* 볼륨 + 닫기 */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleMute}
              className="flex h-8 w-8 items-center justify-center transition-opacity hover:opacity-60"
              aria-label={isMuted || volume === 0 ? "음소거 해제" : "음소거"}
            >
              <VolumeIcon muted={isMuted || volume === 0} level={displayVolume} />
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={displayVolume}
              onChange={(e) => handleVolumeChange(Number(e.target.value))}
              className="hidden h-1 w-16 cursor-pointer accent-foreground md:block"
              aria-label="음량 조절"
            />
            <button
              onClick={close}
              className="flex h-8 w-8 items-center justify-center transition-opacity hover:opacity-60"
              aria-label="재생 종료"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
