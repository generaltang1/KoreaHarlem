import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MusicDetailClient } from "@/components/music/MusicDetailClient";
import { getArtistName } from "@/lib/tracks";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function MusicDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: track } = await supabase
    .from("tracks")
    .select("*, artists(name)")
    .eq("id", id)
    .single();

  if (!track) notFound();

  const trackData = {
    id: track.id,
    title: track.title,
    artist: getArtistName(track.artists),
    audio_url: track.audio_url,
    cover_url: track.cover_url,
    duration: track.duration,
    description: track.description,
  };

  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-16 pb-28 md:px-6">
        <MusicDetailClient track={trackData} />
      </main>
      <Footer />
    </>
  );
}
