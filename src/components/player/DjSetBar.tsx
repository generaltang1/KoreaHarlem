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
  const { tracks, current, isPlaying, currentTime, duration, ready, toggle, playNext } =
    useDjSet();

  if (!ready || tracks.length === 0 || !current) return null;

  return (
    <div className="border-b border-neutral-800 bg-[#0a0a0c] text-neutral-100">
      <div className="mx-auto flex h-11 max-w-[1720px] items-center gap-3 px-4 sm:px-8">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center bg-[#FEE500] text-[10px] font-black text-black">
          KH
        </span>
        <span className="hidden items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-[#FEE500] sm:flex">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#FEE500]" />
          ON AIR
        </span>
        <button
          type="button"
          onClick={toggle}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-neutral-700 bg-neutral-900 text-white transition-colors hover:border-white"
          aria-label={isPlaying ? "DJ SET 일시정지" : "DJ SET 재생"}
        >
          {isPlaying ? (
            <span className="text-[9px] leading-none">❚❚</span>
          ) : (
            <span className="ml-0.5 text-[9px] leading-none">▶</span>
          )}
        </button>
        {current.cover_url && (
          <span className="relative hidden h-7 w-7 shrink-0 overflow-hidden bg-neutral-900 sm:block">
            <Image src={current.cover_url} alt="" fill className="object-cover" sizes="28px" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-white sm:text-[13px]">
            {current.title}
            {current.artist ? (
              <span className="font-normal text-neutral-400"> / {current.artist}</span>
            ) : null}
          </p>
        </div>
        <span className="hidden shrink-0 font-mono text-[10px] tabular-nums text-neutral-500 sm:inline">
          {formatTime(currentTime)}
          {duration > 0 ? ` / ${formatTime(duration)}` : " / --:--"}
        </span>
        <button
          type="button"
          onClick={playNext}
          className="hidden shrink-0 items-center gap-1 border border-neutral-800 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-neutral-400 transition-colors hover:border-neutral-500 hover:text-white sm:inline-flex"
        >
          ≡ 다음 곡
        </button>
      </div>
    </div>
  );
}
