import type { Track } from "@/context/PlayerContext";
import type { DbAlbumTrack } from "@/lib/albums";
import type { MusicAlbumCard } from "@/lib/musicCatalog";

/** 앨범 카드 트랙 → 하단 MusicPlayer 큐 */
export function cardTracksToPlayerQueue(album: MusicAlbumCard): Track[] {
  return album.tracks
    .filter((t) => Boolean(t.audio_url))
    .map((track) => ({
      id: track.id,
      albumId: album.id,
      albumTitle: album.title,
      title: track.title,
      artist: album.artist || "koreaharlem",
      audio_url: track.audio_url!,
      cover_url: album.cover_url,
      description: track.description,
      duration: track.duration,
    }));
}

export function dbTracksToPlayerQueue(
  tracks: DbAlbumTrack[],
  album: { id: string; title?: string; artist: string; cover_url?: string | null },
): Track[] {
  return [...tracks]
    .filter((t) => Boolean(t.audio_url))
    .sort((a, b) => a.track_order - b.track_order)
    .map((track) => ({
      id: track.id,
      albumId: album.id,
      albumTitle: album.title ?? null,
      title: track.title,
      artist: album.artist || "koreaharlem",
      audio_url: track.audio_url!,
      cover_url: album.cover_url,
      description: track.description,
      duration: track.duration,
    }));
}
