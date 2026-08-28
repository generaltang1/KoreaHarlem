import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { mapAlbumTrackToPlayerTrack } from "@/lib/albums";
import type { Track } from "@/context/PlayerContext";
import { shuffleArray } from "@/lib/playerShuffle";

/** 앨범 종료 후 이어 들을 랜덤 앨범 전체 트랙 (수록 순서) */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const excludeAlbumId = searchParams.get("excludeAlbumId") ?? "";

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("albums")
    .select("id, artist_name, cover_url, album_tracks(*)")
    .limit(80);

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  type AlbumRow = {
    id: string;
    artist_name?: string | null;
    cover_url?: string | null;
    album_tracks: {
      id: string;
      album_id: string;
      track_order: number;
      title: string;
      description?: string | null;
      audio_url: string;
      duration?: number | null;
    }[];
  };

  let albums = ((data ?? []) as AlbumRow[]).filter(
    (album) =>
      album.id !== excludeAlbumId &&
      Array.isArray(album.album_tracks) &&
      album.album_tracks.some((t) => t.audio_url),
  );

  if (albums.length === 0) {
    return NextResponse.json({ tracks: [] });
  }

  shuffleArray(albums);
  const picked = albums[0];
  const sortedTracks = [...picked.album_tracks]
    .filter((t) => t.audio_url)
    .sort((a, b) => a.track_order - b.track_order);

  const tracks: Track[] = sortedTracks.map((row) =>
    mapAlbumTrackToPlayerTrack(row, {
      id: picked.id,
      artist_name: picked.artist_name,
      cover_url: picked.cover_url,
    }),
  );

  return NextResponse.json({ tracks, albumId: picked.id });
}
