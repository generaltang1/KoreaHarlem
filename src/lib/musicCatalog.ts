import type { DbAlbum, DbAlbumTrack } from "@/lib/albums";
import { getAlbumArtistName } from "@/lib/albums";

export type MusicAlbumCard = {
  id: string;
  title: string;
  artist: string;
  artistId: string | null;
  cover_url: string | null;
  description: string | null;
  digital_price_krw: number | null;
  created_at: string;
  tracks: DbAlbumTrack[];
};

export function mapAlbumRow(row: {
  id: string;
  title: string;
  artist_id?: string | null;
  artist_name?: string | null;
  description?: string | null;
  cover_url?: string | null;
  digital_price_krw?: number | null;
  created_at: string;
  artists?: { name?: string } | { name?: string }[] | null;
  album_tracks?: DbAlbumTrack[] | null;
}): MusicAlbumCard {
  const joinedName = Array.isArray(row.artists)
    ? row.artists[0]?.name
    : row.artists?.name;
  return {
    id: row.id,
    title: row.title,
    artist: getAlbumArtistName({
      artist_name: row.artist_name || joinedName || null,
    }),
    artistId: row.artist_id ?? null,
    cover_url: row.cover_url ?? null,
    description: row.description ?? null,
    digital_price_krw: row.digital_price_krw ?? null,
    created_at: row.created_at,
    tracks: [...(row.album_tracks ?? [])].sort((a, b) => a.track_order - b.track_order),
  };
}

export function shuffleInPlace<T>(items: T[]): T[] {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

export function formatKrwPrice(price: number) {
  return `₩${price.toLocaleString("ko-KR")}`;
}

export function albumDateLabel(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d
    .toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    .toUpperCase();
}
