"use client";

import { useEffect, useMemo, useState } from "react";
import { loadTrackDurations, readDurationCache } from "@/lib/audioDuration";

type TrackWithAudio = {
  id: string;
  audio_url: string;
  duration?: number | null;
};

function buildInitialDurations(tracks: TrackWithAudio[]): Record<string, number> {
  const cache = typeof window !== "undefined" ? readDurationCache() : {};

  const initial: Record<string, number> = {};
  for (const track of tracks) {
    if (track.duration && track.duration > 0) {
      initial[track.id] = track.duration;
    } else if (cache[track.id]) {
      initial[track.id] = cache[track.id];
    }
  }
  return initial;
}

/** DB·캐시·오디오 메타데이터에서 트랙 길이를 한 번에 불러옵니다. */
export function useTrackDurations(tracks: TrackWithAudio[]) {
  const tracksKey = useMemo(
    () => tracks.map((t) => `${t.id}:${t.duration ?? ""}:${t.audio_url}`).join("|"),
    [tracks],
  );

  const [durations, setDurations] = useState<Record<string, number>>(() =>
    buildInitialDurations(tracks),
  );

  useEffect(() => {
    const missing = tracks.filter((t) => !t.duration && t.audio_url);
    if (missing.length === 0) return;

    let cancelled = false;

    loadTrackDurations(missing).then((loaded) => {
      if (cancelled) return;
      setDurations((prev) => ({ ...prev, ...loaded }));

      const updates = Object.entries(loaded).map(([id, duration]) => ({ id, duration }));
      if (updates.length > 0) {
        fetch("/api/music/durations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ updates }),
        }).catch(() => {});
      }
    });

    return () => {
      cancelled = true;
    };
  }, [tracksKey, tracks]);

  return durations;
}
