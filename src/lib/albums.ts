import type { Track } from "@/context/PlayerContext";

export interface DbAlbum {
  id: string;
  title: string;
  artist_id?: string | null;
  artist_name?: string | null;
  description?: string | null;
  cover_url?: string | null;
  digital_price_krw?: number | null;
  created_at: string;
}

export interface DbAlbumTrack {
  id: string;
  album_id: string;
  track_order: number;
  title: string;
  description?: string | null;
  audio_url: string;
  duration?: number | null;
  is_title_track?: boolean;
  digital_price_krw?: number | null;
  download_wav_url?: string | null;
  download_mp3_url?: string | null;
}

export interface AlbumWithTracks extends DbAlbum {
  album_tracks: DbAlbumTrack[];
}

export function mapAlbumTrackToPlayerTrack(
  track: DbAlbumTrack,
  album: Pick<DbAlbum, "id" | "title" | "artist_name" | "cover_url">,
): Track {
  return {
    id: track.id,
    albumId: album.id,
    albumTitle: album.title,
    title: track.title,
    artist: album.artist_name?.trim() || "Unknown",
    audio_url: track.audio_url,
    cover_url: album.cover_url,
    description: track.description,
    duration: track.duration,
  };
}

export function mapAlbumToPlayerTracks(album: AlbumWithTracks): Track[] {
  return [...album.album_tracks]
    .sort((a, b) => a.track_order - b.track_order)
    .map((track) => mapAlbumTrackToPlayerTrack(track, album));
}

export function getAlbumArtistName(album: Pick<DbAlbum, "artist_name">): string {
  return album.artist_name?.trim() || "Unknown";
}

export function formatTrackDuration(sec?: number | null) {
  if (sec == null || !Number.isFinite(sec) || sec < 0) return "—";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function isPricedForSale(price?: number | null): price is number {
  return typeof price === "number" && Number.isFinite(price) && price > 0;
}
