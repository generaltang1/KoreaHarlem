"use client";

import { TrackCard } from "@/components/player/TrackCard";
import type { Track } from "@/context/PlayerContext";

interface MusicTrackListProps {
  tracks: Track[];
}

export function MusicTrackList({ tracks }: MusicTrackListProps) {
  if (tracks.length === 0) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-sm text-muted">등록된 음악이 없습니다.</p>
      </div>
    );
  }

  return (
    <div>
      {tracks.map((track) => (
        <TrackCard key={track.id} track={track} />
      ))}
    </div>
  );
}
