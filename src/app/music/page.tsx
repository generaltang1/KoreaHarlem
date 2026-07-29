import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { TrackCard } from "@/components/player/TrackCard";
import type { Track } from "@/context/PlayerContext";

export default async function MusicPage() {
  const supabase = await createClient();
  const { data: tracks } = await supabase
    .from("tracks")
    .select("*, artists(name)")
    .order("created_at", { ascending: false });

  const trackList: Track[] = (tracks ?? []).map((t) => ({
    id: t.id,
    title: t.title,
    artist: (t.artists as { name: string } | null)?.name ?? "Unknown",
    audio_url: t.audio_url,
    cover_url: t.cover_url,
    duration: t.duration,
  }));

  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-16 pb-28 md:px-6">
        <div className="mb-10">
          <p className="text-[10px] uppercase tracking-widest text-muted">Music</p>
          <h1 className="mt-1 text-2xl font-medium uppercase tracking-wider">음악</h1>
        </div>

        {trackList.length === 0 ? (
          <div className="flex min-h-[40vh] items-center justify-center">
            <p className="text-sm text-muted">등록된 음악이 없습니다.</p>
          </div>
        ) : (
          <div>
            {trackList.map((track) => (
              <TrackCard key={track.id} track={track} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
