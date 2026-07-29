import type { Track } from "@/context/PlayerContext";

export interface DbTrack {
  id: string;
  title: string;
  audio_url: string;
  cover_url?: string | null;
  duration?: number | null;
  description?: string | null;
  artists?: { name: string } | { name: string }[] | null;
}

export function mapDbTracksToPlayerTracks(tracks: DbTrack[]): Track[] {
  return tracks.map((track) => ({
    id: track.id,
    title: track.title,
    artist: getArtistName(track.artists),
    audio_url: track.audio_url,
    cover_url: track.cover_url,
    duration: track.duration,
  }));
}

export function getArtistName(
  artists: DbTrack["artists"],
): string {
  if (!artists) return "Unknown";
  if (Array.isArray(artists)) return artists[0]?.name ?? "Unknown";
  return artists.name ?? "Unknown";
}
