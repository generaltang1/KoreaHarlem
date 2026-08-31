"use client";

import { useCallback, useRef, useState } from "react";

function formatTime(sec: number) {
  if (!isFinite(sec) || isNaN(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

type PlayerProgressBarProps = {
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
};

export function PlayerProgressBar({ currentTime, duration, onSeek }: PlayerProgressBarProps) {
  const barRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [previewTime, setPreviewTime] = useState<number | null>(null);

  const displayTime = previewTime ?? currentTime;
  const progress = duration > 0 ? Math.max(0, Math.min(100, (displayTime / duration) * 100)) : 0;

  const timeFromClientX = useCallback(
    (clientX: number) => {
      const el = barRef.current;
      if (!el || duration <= 0) return 0;
      const rect = el.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      return ratio * duration;
    },
    [duration],
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (duration <= 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
    const t = timeFromClientX(e.clientX);
    setPreviewTime(t);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging || duration <= 0) return;
    setPreviewTime(timeFromClientX(e.clientX));
  };

  const finishDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    const t = previewTime ?? timeFromClientX(e.clientX);
    onSeek(t);
    setDragging(false);
    setPreviewTime(null);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <span className="hidden w-10 shrink-0 text-[10px] text-muted tabular-nums sm:block">
        {formatTime(displayTime)}
      </span>
      <div
        ref={barRef}
        role="slider"
        aria-label="재생 위치"
        aria-valuemin={0}
        aria-valuemax={duration}
        aria-valuenow={displayTime}
        className="group relative flex-1 cursor-pointer touch-none py-2"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishDrag}
        onPointerCancel={finishDrag}
      >
        <div className="relative h-1 bg-border transition-[height] group-active:h-1.5">
          <div
            className="absolute inset-y-0 left-0 bg-foreground transition-[width] duration-75"
            style={{ width: `${progress}%` }}
          />
          {duration > 0 && (
            <div
              className={`absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-foreground shadow-sm transition-opacity ${
                dragging ? "opacity-100" : "opacity-0 group-hover:opacity-100"
              }`}
              style={{ left: `calc(${progress}% - 6px)` }}
            />
          )}
        </div>
      </div>
      <span className="hidden w-10 shrink-0 text-right text-[10px] text-muted tabular-nums sm:block">
        {formatTime(duration)}
      </span>
      <span className="w-9 shrink-0 text-right text-[10px] text-muted tabular-nums sm:hidden">
        {formatTime(displayTime)}
      </span>
    </div>
  );
}
