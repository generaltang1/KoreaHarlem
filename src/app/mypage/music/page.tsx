import { redirect } from "next/navigation";
import { MypageShell } from "@/components/mypage/MypageShell";
import { MyMusicClient, type OwnedAlbumRow } from "@/components/mypage/MyMusicClient";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";

export default async function MyMusicPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/mypage/music");
  }

  const admin = createServiceClient() ?? supabase;
  const { data: entitlements } = await admin
    .from("music_entitlements")
    .select("kind, album_id, track_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const albumIds = [
    ...new Set(
      (entitlements ?? [])
        .filter((e) => e.kind === "album" && e.album_id)
        .map((e) => e.album_id as string),
    ),
  ];

  const albums: OwnedAlbumRow[] = [];

  if (albumIds.length > 0) {
    const { data: rows } = await admin
      .from("albums")
      .select(
        "id, title, artist_name, cover_url, digital_price_krw, album_tracks(id, title, track_order, duration, audio_url, download_mp3_url, download_wav_url)",
      )
      .in("id", albumIds);

    for (const album of rows ?? []) {
      const tracks = [...(album.album_tracks ?? [])]
        .sort(
          (a: { track_order: number }, b: { track_order: number }) =>
            a.track_order - b.track_order,
        )
        .map((t: {
          id: string;
          title: string;
          duration?: number | null;
          audio_url?: string | null;
          download_mp3_url?: string | null;
          download_wav_url?: string | null;
        }) => ({
          id: t.id,
          title: t.title,
          duration: t.duration ?? null,
          hasFile: Boolean(t.download_mp3_url || t.audio_url || t.download_wav_url),
          hasWav: Boolean(t.download_wav_url),
        }));

      albums.push({
        id: album.id,
        title: album.title,
        artist: album.artist_name ?? "",
        cover: album.cover_url,
        trackCount: tracks.length,
        priceKrw: album.digital_price_krw ?? null,
        tracks,
      });
    }
  }

  return (
    <MypageShell
      variant="music"
      title="My Music"
      subtitle={`구매한 음원 ${String(albums.length).padStart(2, "0")}`}
      headRight={<span className="text-[12px] font-medium text-[#a8a49b]">최근 구매순 ▾</span>}
    >
      <MyMusicClient albums={albums} />
    </MypageShell>
  );
}
