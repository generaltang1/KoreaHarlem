import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MusicHomeClient } from "@/components/music/MusicHomeClient";
import { createClient } from "@/lib/supabase/server";
import { mapAlbumRow, shuffleInPlace, type MusicAlbumCard } from "@/lib/musicCatalog";
import { searchSaleProductsPaged } from "@/lib/productSearch";
import type { DbArtist } from "@/lib/artists";

export const dynamic = "force-dynamic";

export default async function MusicPage() {
  const supabase = await createClient();

  const fullSelect =
    "id, title, artist_id, artist_name, description, cover_url, digital_price_krw, created_at, artists(name), album_tracks(*)";
  const fallbackSelect =
    "id, title, artist_id, artist_name, description, cover_url, created_at, artists(name), album_tracks(*)";

  let albumRows: unknown[] | null = null;
  const first = await supabase.from("albums").select(fullSelect).order("created_at", { ascending: false }).limit(80);
  if (first.error) {
    const second = await supabase
      .from("albums")
      .select(fallbackSelect)
      .order("created_at", { ascending: false })
      .limit(80);
    albumRows = second.data;
  } else {
    albumRows = first.data;
  }

  const albums: MusicAlbumCard[] = (albumRows ?? []).map((row) =>
    mapAlbumRow(row as Parameters<typeof mapAlbumRow>[0]),
  );

  const newReleases = albums.slice(0, 12);
  const collection = shuffleInPlace([...albums]).slice(0, 12);

  const { data: artistRows } = await supabase.from("artists").select("*").limit(80);
  const artists = shuffleInPlace([...(artistRows ?? [])]) as DbArtist[];
  const featuredArtists = artists.slice(0, 10);

  const merch = await searchSaleProductsPaged(supabase, {
    category: "cd",
    from: 0,
    to: 3,
  });

  return (
    <>
      <Header />
      <main className="bg-black pb-24">
        <MusicHomeClient
          newReleases={newReleases}
          collection={collection}
          artists={featuredArtists}
          merch={merch.data}
        />
      </main>
      <Footer />
    </>
  );
}
