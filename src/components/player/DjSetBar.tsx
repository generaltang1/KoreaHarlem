"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useDjSet } from "@/context/DjSetContext";
import { youtubeEmbedSrc } from "@/lib/djSet";
import { useSupportsAppVolume } from "@/hooks/useSupportsAppVolume";

function formatTime(sec: number) {
  if (!Number.isFinite(sec) || sec < 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function LiveIcon({ className = "h-3 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 12" fill="none" aria-hidden>
      <path
        d="M2 6c2.2-2.8 4.4-2.8 6.6 0M4.2 6c1.2-1.5 2.4-1.5 3.6 0"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <circle cx="12.5" cy="6" r="1.6" fill="currentColor" />
    </svg>
  );
}

function ListIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 14 14" fill="none" aria-hidden>
      <path d="M2 3.5h10M2 7h10M2 10.5h7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function VolumeIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 14 14" fill="none" aria-hidden>
      <path d="M2.5 5.2h2.2L7.5 3v8L4.7 8.8H2.5V5.2Z" fill="currentColor" />
      <path
        d="M9.2 5.2c.7.7.7 2.9 0 3.6M10.8 3.8c1.5 1.5 1.5 4.9 0 6.4"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function WooferIcon({ playing }: { playing: boolean }) {
  return (
    <span
      className={`relative flex h-6 w-6 items-center justify-center rounded-full border border-neutral-600 bg-neutral-900 ${
        playing ? "animate-pulse" : ""
      }`}
      aria-hidden
    >
      <span
        className={`rounded-full bg-neutral-300 transition-transform ${
          playing ? "h-3 w-3 scale-110" : "h-2.5 w-2.5"
        }`}
      />
      <span className="absolute h-1 w-1 rounded-full bg-[#FBC201]" />
    </span>
  );
}

export function DjSetBar() {
  const {
    tracks,
    current,
    index,
    isPlaying,
    currentTime,
    duration,
    volume,
    ready,
    toggle,
    playAt,
    setVolume,
    liveEnabled,
    liveVideoId,
    liveMode,
    enterLive,
    exitLive,
  } = useDjSet();
  const supportsVolume = useSupportsAppVolume();
  const [playlistOpen, setPlaylistOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const next = tracks.length > 1 ? tracks[(index + 1) % tracks.length] : null;
  const hasTracks = tracks.length > 0 && !!current;
  const hasLive = liveEnabled && !!liveVideoId;
  const titleText = liveMode
    ? "YouTube LIVE"
    : current?.title ?? (hasLive ? "DJ SET" : "");
  const artistText = liveMode ? "라이브 스트리밍" : current?.artist ?? "";
  const showLiveOnly = !hasTracks && hasLive;

  useEffect(() => {
    if (!playlistOpen) return;
    const onPointer = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setPlaylistOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPlaylistOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [playlistOpen]);

  if (!ready || (!hasTracks && !hasLive)) return null;

  return (
    <div ref={rootRef} className="relative z-10 border-b border-neutral-800 bg-[#050505] text-[#F4F1EA]">
      {liveMode && liveVideoId && isPlaying ? (
        <iframe
          key={`${liveVideoId}-play`}
          title="DJ SET YouTube Live"
          src={youtubeEmbedSrc(liveVideoId, true)}
          allow="autoplay; encrypted-media"
          className="pointer-events-none absolute h-px w-px opacity-0"
          tabIndex={-1}
        />
      ) : null}

      {/* Desktop bar */}
      <div className="mx-auto hidden h-11 max-w-[1720px] items-center gap-3.5 pr-6 sm:flex">
        <span className="flex h-11 w-[52px] shrink-0 items-center justify-center bg-[#FBC201] font-black text-[14px] text-[#0a0a0a]">
          KH
        </span>
        <span className="flex items-center gap-2.5 font-mono text-[10px] uppercase tracking-[1.5px] text-[#F4F1EA]">
          {liveMode ? "LIVE" : "ON AIR"}
          <LiveIcon className="h-3 w-4 text-[#F4F1EA]" />
        </span>
        <button
          type="button"
          onClick={() => {
            if (showLiveOnly && !liveMode) {
              enterLive();
              return;
            }
            toggle();
          }}
          className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full bg-[#F4F1EA] text-black transition hover:bg-white"
          aria-label={isPlaying ? "DJ SET 일시정지" : "DJ SET 재생"}
        >
          {isPlaying ? (
            <span className="flex gap-0.5">
              <span className="h-2.5 w-0.5 bg-black" />
              <span className="h-2.5 w-0.5 bg-black" />
            </span>
          ) : (
            <span className="ml-0.5 border-y-[5px] border-l-[8px] border-y-transparent border-l-black" />
          )}
        </button>
        {!liveMode && current?.cover_url ? (
          <span className="relative h-7 w-7 shrink-0 overflow-hidden rounded-[3px] bg-neutral-900">
            <Image src={current.cover_url} alt="" fill className="object-cover" sizes="28px" />
          </span>
        ) : (
          <span
            className={`h-7 w-7 shrink-0 rounded-[3px] ${liveMode ? "bg-rose-700" : "bg-neutral-800"}`}
          />
        )}
        <div className="flex min-w-0 items-center gap-2.5 overflow-hidden whitespace-nowrap">
          <span className="truncate text-xs font-bold tracking-wide text-[#F4F1EA]">{titleText}</span>
          {artistText ? (
            <>
              <span className="shrink-0 font-mono text-[11px] text-[#6E6B65]">/</span>
              <span className="shrink-0 text-xs font-bold tracking-wide text-[#A8A49B]">{artistText}</span>
            </>
          ) : null}
        </div>
        <div className="h-px min-w-px flex-1" />
        {!liveMode ? (
          <span className="shrink-0 font-mono text-[10px] tabular-nums text-[#A8A49B]">
            {formatTime(currentTime)}
            {duration > 0 ? ` / ${formatTime(duration)}` : " / --:--"}
          </span>
        ) : (
          <span className="shrink-0 font-mono text-[10px] text-rose-400">STREAMING</span>
        )}
        {liveEnabled && liveVideoId ? (
          <button
            type="button"
            onClick={() => {
              if (liveMode) exitLive();
              else enterLive();
            }}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded border px-2.5 py-1 text-[10px] font-medium transition ${
              liveMode
                ? "border-rose-500 bg-rose-500/20 text-rose-300"
                : "border-neutral-700 text-[#A8A49B] hover:border-rose-500 hover:text-rose-300"
            }`}
          >
            라이브 듣기
          </button>
        ) : null}
        {!liveMode && tracks.length > 0 ? (
          <button
            type="button"
            onClick={() => setPlaylistOpen((v) => !v)}
            aria-expanded={playlistOpen}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded border px-2.5 py-1 text-[10px] font-medium transition ${
              playlistOpen
                ? "border-[#FBC201] bg-[rgba(251,194,1,0.15)] text-[#FBC201]"
                : "border-neutral-700 text-[#A8A49B] hover:border-neutral-500 hover:text-[#F4F1EA]"
            }`}
          >
            <ListIcon />
            다음 곡
            <span aria-hidden className="text-[10px]">
              {playlistOpen ? "▲" : "▼"}
            </span>
          </button>
        ) : null}
        {supportsVolume && !liveMode && (
          <div className="flex shrink-0 items-center gap-1.5">
            <VolumeIcon className="h-3.5 w-3.5 text-[#A8A49B]" />
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              aria-label="DJ SET 음량"
              className="h-[3px] w-14 cursor-pointer appearance-none bg-[rgba(244,241,234,0.15)] accent-[#A8A49B] [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#A8A49B]"
            />
          </div>
        )}
      </div>

      {/* Mobile bar */}
      <div className="flex h-10 items-center gap-2.5 pr-3.5 sm:hidden">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center bg-[#FBC201] text-xs font-black text-[#0a0a0a]">
          KH
        </span>
        <button
          type="button"
          onClick={() => {
            if (showLiveOnly && !liveMode) {
              enterLive();
              return;
            }
            toggle();
          }}
          className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-[#F4F1EA] text-black"
          aria-label={isPlaying ? "DJ SET 일시정지" : "DJ SET 재생"}
        >
          {isPlaying ? (
            <span className="flex gap-0.5">
              <span className="h-2 w-0.5 bg-black" />
              <span className="h-2 w-0.5 bg-black" />
            </span>
          ) : (
            <span className="ml-0.5 border-y-[4px] border-l-[7px] border-y-transparent border-l-black" />
          )}
        </button>
        <span className="shrink-0 text-[11px] font-bold">{liveMode ? "LIVE" : "ON AIR"}</span>
        <LiveIcon className="h-3 w-4 shrink-0" />
        <p className="min-w-0 flex-1 truncate text-[11px] font-bold">
          {titleText}
          {artistText ? ` — ${artistText}` : ""}
        </p>
        {liveEnabled && liveVideoId ? (
          <button
            type="button"
            onClick={() => {
              if (liveMode) exitLive();
              else enterLive();
            }}
            className={`shrink-0 px-1 text-[10px] font-bold ${liveMode ? "text-rose-400" : "text-[#A8A49B]"}`}
          >
            라이브
          </button>
        ) : null}
        {!liveMode && tracks.length > 0 ? (
          <button
            type="button"
            onClick={() => setPlaylistOpen((v) => !v)}
            aria-label="다음 곡 목록"
            className="shrink-0 p-1 text-[#A8A49B]"
          >
            <ListIcon className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {playlistOpen && !liveMode && current ? (
        <div className="border-b border-neutral-800 bg-[#151515] px-4 py-4 shadow-[0_16px_32px_rgba(0,0,0,0.35)] sm:px-6">
          <div className="mx-auto max-w-[1720px]">
            <div className="flex flex-wrap items-center gap-3 border-b border-neutral-800 py-2">
              <p className="text-sm font-black tracking-wide text-[#F4F1EA]">
                DJ SET · <span className="font-medium">지금</span> &{" "}
                <span className="font-medium">다음</span>
              </p>
              <p className="text-xs text-[#6E6B65]">지금 트는 곡과 다음 곡만 보여요</p>
            </div>

            <div className="mt-1 flex items-center gap-4 rounded-md border-b border-neutral-800 bg-[rgba(251,194,1,0.06)] px-2 py-1">
              <span className="w-10 shrink-0 font-mono text-[10px] tracking-widest text-[#FBC201]">
                NOW
              </span>
              {current.cover_url ? (
                <span className="relative h-[26px] w-[26px] shrink-0 overflow-hidden rounded-[3px]">
                  <Image src={current.cover_url} alt="" fill className="object-cover" sizes="26px" />
                </span>
              ) : (
                <span className="h-[26px] w-[26px] shrink-0 rounded-[3px] bg-neutral-800" />
              )}
              <p className="min-w-0 flex-1 truncate text-[13px] font-bold text-[#F4F1EA] sm:max-w-[360px] sm:flex-none">
                {current.title}
              </p>
              {current.artist ? (
                <p className="hidden shrink-0 text-xs font-bold text-[#A8A49B] sm:block">
                  {current.artist}
                </p>
              ) : null}
              <div className="hidden h-px min-w-px flex-1 sm:block" />
              <p className="hidden shrink-0 font-mono text-[10px] text-[#6E6B65] sm:block">
                {duration > 0 ? formatTime(duration) : "--:--"}
              </p>
              <WooferIcon playing={isPlaying} />
            </div>

            {next ? (
              <button
                type="button"
                onClick={() => {
                  playAt((index + 1) % tracks.length);
                  setPlaylistOpen(false);
                }}
                className="mt-0.5 flex w-full items-center gap-4 rounded-md border-b border-neutral-800 px-2 py-1 text-left transition hover:bg-white/5"
              >
                <span className="w-10 shrink-0 font-mono text-[10px] tracking-widest text-[#6E6B65]">
                  NEXT
                </span>
                {next.cover_url ? (
                  <span className="relative h-[26px] w-[26px] shrink-0 overflow-hidden rounded-[3px]">
                    <Image src={next.cover_url} alt="" fill className="object-cover" sizes="26px" />
                  </span>
                ) : (
                  <span className="h-[26px] w-[26px] shrink-0 rounded-[3px] bg-[rgba(244,241,234,0.05)]" />
                )}
                <p className="min-w-0 flex-1 truncate text-[13px] font-bold text-[#A8A49B] sm:max-w-[360px] sm:flex-none">
                  {next.title}
                </p>
                {next.artist ? (
                  <p className="hidden shrink-0 text-xs font-bold text-[#A8A49B] sm:block">
                    {next.artist}
                  </p>
                ) : null}
                <div className="hidden h-px min-w-px flex-1 sm:block" />
                <span
                  className="ml-auto shrink-0 border-y-[5px] border-l-[8px] border-y-transparent border-l-[#A8A49B] sm:ml-0"
                  aria-hidden
                />
              </button>
            ) : (
              <p className="px-2 py-3 text-xs text-[#6E6B65]">다음 곡이 없습니다.</p>
            )}

            <div className="flex flex-wrap items-center gap-3 py-2">
              <p className="text-[11px] text-[#6E6B65]">
                다른 DJ SET은 DJ SET 카테고리에서 골라 들을 수 있어요
              </p>
              <div className="h-px min-w-px flex-1" />
              <Link
                href="/music"
                className="rounded-full bg-[#FBC201] px-3.5 py-1.5 text-xs font-medium text-[#0a0a0a] transition hover:bg-[#ffd84a]"
                onClick={() => setPlaylistOpen(false)}
              >
                DJ SET 전체 보기 →
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
