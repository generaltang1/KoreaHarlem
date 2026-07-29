"use client";

import { MusicCard } from "@/components/music/MusicCard";
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
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {tracks.map((track) => (
        <MusicCard key={track.id} track={track} />
      ))}
    </div>
  );
}
