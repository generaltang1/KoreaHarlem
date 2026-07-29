import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AlbumDetailClient } from "@/components/music/AlbumDetailClient";
import type { AlbumWithTracks } from "@/lib/albums";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AlbumDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: album } = await supabase
    .from("albums")
    .select("*, album_tracks(*)")
    .eq("id", id)
    .single();

  if (!album || !album.album_tracks?.length) notFound();

  const albumData: AlbumWithTracks = {
    id: album.id,
    title: album.title,
    artist_name: album.artist_name,
    description: album.description,
    cover_url: album.cover_url,
    created_at: album.created_at,
    album_tracks: album.album_tracks,
  };

  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-16 pb-28 md:px-6">
        <AlbumDetailClient album={albumData} />
      </main>
      <Footer />
    </>
  );
}
