"use client";

import Image from "next/image";
import { useDjSet } from "@/context/DjSetContext";

function formatTime(sec: number) {
  if (!Number.isFinite(sec) || sec < 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function DjSetBar() {
  const { tracks, current, isPlaying, currentTime, duration, ready, toggle } = useDjSet();

  if (!ready || tracks.length === 0 || !current) return null;

  return (
    <div className="border-b border-neutral-800 bg-[#0a0a0c] text-neutral-100">
      <button
        type="button"
        onClick={toggle}
        className="mx-auto flex w-full max-w-[1720px] items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-neutral-900/80 sm:px-8"
        aria-label={isPlaying ? "DJ SET 일시정지" : "DJ SET 재생"}
      >
        <span className="shrink-0 text-[10px] font-bold uppercase tracking-widest text-neutral-400">
          DJ SET
        </span>
        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-neutral-700 ${
            isPlaying ? "bg-white text-black" : "bg-neutral-900 text-white"
          }`}
        >
          {isPlaying ? (
            <span className="text-[10px] leading-none">❚❚</span>
          ) : (
            <span className="ml-0.5 text-[10px] leading-none">▶</span>
          )}
        </span>
        {current.cover_url && (
          <span className="relative hidden h-8 w-8 shrink-0 overflow-hidden rounded-sm bg-neutral-900 sm:block">
            <Image src={current.cover_url} alt="" fill className="object-cover" sizes="32px" />
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-xs font-semibold text-white sm:text-sm">
            {current.title}
            {current.artist ? (
              <span className="font-normal text-neutral-400"> — {current.artist}</span>
            ) : null}
          </span>
          <span className="mt-0.5 block font-mono text-[10px] text-neutral-500">
            {formatTime(currentTime)}
            {duration > 0 ? ` / ${formatTime(duration)}` : ""}
            {isPlaying ? " · PLAYING" : ""}
          </span>
        </span>
      </button>
    </div>
  );
}
