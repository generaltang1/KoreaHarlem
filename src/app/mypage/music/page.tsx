import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";

type OwnedTrack = {
  id: string;
  title: string;
  albumTitle: string;
  artist: string;
  cover: string | null;
  hasWav: boolean;
  hasMp3: boolean;
};

export default async function MyMusicPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <>
        <Header />
        <main className="mx-auto max-w-3xl px-4 py-16">
          <h1 className="text-2xl font-medium uppercase tracking-wider">My Music</h1>
          <p className="mt-6 text-sm text-muted">로그인이 필요합니다.</p>
          <Link href="/login?next=/mypage/music" className="mt-4 inline-block text-xs uppercase underline">
            Sign In
          </Link>
        </main>
        <Footer />
      </>
    );
  }

  const admin = createServiceClient() ?? supabase;
  const { data: entitlements } = await admin
    .from("music_entitlements")
    .select("kind, album_id, track_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const albumIds = [...new Set((entitlements ?? []).map((e) => e.album_id).filter(Boolean))] as string[];
  const trackIds = [...new Set((entitlements ?? []).filter((e) => e.kind === "track").map((e) => e.track_id).filter(Boolean))] as string[];

  const tracksById = new Map<string, OwnedTrack>();

  if (albumIds.length > 0) {
    const { data: albums } = await admin
      .from("albums")
      .select("id, title, artist_name, cover_url, album_tracks(id, title, audio_url, download_mp3_url, download_wav_url)")
      .in("id", albumIds);

    for (const album of albums ?? []) {
      const ownedAlbum = (entitlements ?? []).some((e) => e.kind === "album" && e.album_id === album.id);
      for (const track of album.album_tracks ?? []) {
        if (!ownedAlbum && !trackIds.includes(track.id)) continue;
        tracksById.set(track.id, {
          id: track.id,
          title: track.title,
          albumTitle: album.title,
          artist: album.artist_name ?? "",
          cover: album.cover_url,
          hasMp3: Boolean(track.download_mp3_url || track.audio_url),
          hasWav: Boolean(track.download_wav_url),
        });
      }
    }
  }

  if (trackIds.length > 0) {
    const missing = trackIds.filter((id) => !tracksById.has(id));
    if (missing.length > 0) {
      const { data: extra } = await admin
        .from("album_tracks")
        .select("id, title, audio_url, download_mp3_url, download_wav_url, albums(title, artist_name, cover_url)")
        .in("id", missing);
      for (const track of extra ?? []) {
        const album = Array.isArray(track.albums) ? track.albums[0] : track.albums;
        tracksById.set(track.id, {
          id: track.id,
          title: track.title,
          albumTitle: album?.title ?? "",
          artist: album?.artist_name ?? "",
          cover: album?.cover_url ?? null,
          hasMp3: Boolean(track.download_mp3_url || track.audio_url),
          hasWav: Boolean(track.download_wav_url),
        });
      }
    }
  }

  const tracks = [...tracksById.values()];

  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-16 pb-24 md:px-6">
        <p className="text-[10px] uppercase tracking-widest text-muted">Account</p>
        <h1 className="mt-1 text-2xl font-medium uppercase tracking-wider">My Music</h1>
        <p className="mt-2 text-sm text-muted">구매한 음원을 MP3 / WAV로 받을 수 있습니다. 스트리밍은 무료입니다.</p>

        {tracks.length === 0 ? (
          <p className="mt-10 text-sm text-muted">구매한 음원이 없습니다.</p>
        ) : (
          <ul className="mt-8 divide-y divide-border border border-border">
            {tracks.map((track) => (
              <li key={track.id} className="flex items-center gap-4 px-4 py-3">
                <div className="relative h-12 w-12 shrink-0 overflow-hidden bg-neutral-100">
                  {track.cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={track.cover} alt="" className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <p className="min-w-0 flex-1 truncate text-sm">
                  {track.artist ? (
                    <>
                      <span className="text-muted">{track.artist}</span>
                      <span className="text-muted"> · </span>
                    </>
                  ) : null}
                  <span className="font-medium">{track.title}</span>
                </p>
                <div className="flex shrink-0 gap-2">
                  {track.hasMp3 && (
                    <a
                      href={`/api/music/download?trackId=${track.id}&format=mp3`}
                      download
                      className="border border-border px-3 py-1.5 text-[10px] uppercase tracking-widest hover:border-foreground"
                    >
                      MP3 다운로드
                    </a>
                  )}
                  {track.hasWav && (
                    <a
                      href={`/api/music/download?trackId=${track.id}&format=wav`}
                      download
                      className="border border-border px-3 py-1.5 text-[10px] uppercase tracking-widest hover:border-foreground"
                    >
                      WAV 다운로드
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
      <Footer />
    </>
  );
}
