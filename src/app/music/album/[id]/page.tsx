import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AlbumDetailClient } from "@/components/music/AlbumDetailClient";
import type { AlbumWithTracks } from "@/lib/albums";
import { getAlbumArtistName } from "@/lib/albums";
import { searchSaleProductsPaged } from "@/lib/productSearch";

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
    artist_id: album.artist_id,
    artist_name: album.artist_name,
    description: album.description,
    cover_url: album.cover_url,
    digital_price_krw: album.digital_price_krw ?? null,
    created_at: album.created_at,
    album_tracks: album.album_tracks,
  };

  let relatedAlbums: { id: string; title: string; artist: string; cover_url: string | null }[] = [];
  const relatedQuery = await supabase
    .from("albums")
    .select("id, title, artist_name, cover_url, is_published")
    .neq("id", id)
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(4);
  const relatedRows =
    relatedQuery.error
      ? (
          await supabase
            .from("albums")
            .select("id, title, artist_name, cover_url")
            .neq("id", id)
            .order("created_at", { ascending: false })
            .limit(4)
        ).data
      : relatedQuery.data;
  relatedAlbums = (relatedRows ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    artist: getAlbumArtistName({ artist_name: row.artist_name }),
    cover_url: row.cover_url,
  }));

  const merch = await searchSaleProductsPaged(supabase, {
    category: "cd",
    from: 0,
    to: 3,
  });

  return (
    <>
      <Header />
      <main className="bg-[#050505]">
        <AlbumDetailClient
          album={albumData}
          relatedAlbums={relatedAlbums}
          relatedMerch={merch.data}
        />
      </main>
      <Footer />
    </>
  );
}
