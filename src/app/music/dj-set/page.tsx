import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import {
  DjSetArchiveClient,
  type DjArchiveTrack,
} from "@/components/music/DjSetArchiveClient";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type DjRow = {
  id: string;
  title: string;
  artist: string | null;
  cover_url: string | null;
  audio_url: string;
  sort_order: number;
};

export default async function MusicDjSetPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("dj_set_tracks")
    .select("id, title, artist, cover_url, audio_url, sort_order")
    .eq("is_published", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  const tracks: DjArchiveTrack[] = ((data ?? []) as DjRow[]).map((row) => ({
    id: row.id,
    title: row.title,
    artist_name: row.artist,
    cover_url: row.cover_url,
    audio_url: row.audio_url,
    duration: null,
    sort_order: row.sort_order,
  }));

  return (
    <>
      <Header />
      <DjSetArchiveClient tracks={tracks} />
      <Footer />
    </>
  );
}
