import type { Track } from "@/context/PlayerContext";

export interface DbAlbum {
  id: string;
  title: string;
  artist_name?: string | null;
  description?: string | null;
  cover_url?: string | null;
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
}

export interface AlbumWithTracks extends DbAlbum {
  album_tracks: DbAlbumTrack[];
}

export function mapAlbumTrackToPlayerTrack(
  track: DbAlbumTrack,
  album: Pick<DbAlbum, "id" | "artist_name" | "cover_url">,
): Track {
  return {
    id: track.id,
    albumId: album.id,
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
