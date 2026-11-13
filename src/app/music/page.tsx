import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MusicHomeClient } from "@/components/music/MusicHomeClient";
import { createClient } from "@/lib/supabase/server";
import { publishDueAlbums } from "@/lib/albumPublish";
import { mapAlbumRow, shuffleInPlace, type MusicAlbumCard } from "@/lib/musicCatalog";
import { searchSaleProductsPaged } from "@/lib/productSearch";
import type { DbArtist } from "@/lib/artists";

export const dynamic = "force-dynamic";

export type MusicMagazineCard = {
  id: string;
  title: string;
  excerpt: string | null;
  cover_url: string | null;
  slug: string | null;
  category: string | null;
};

export default async function MusicPage() {
  const supabase = await createClient();
  await publishDueAlbums(supabase);

  const fullSelect =
    "id, title, artist_id, artist_name, description, cover_url, digital_price_krw, created_at, is_published, artists(name), album_tracks(*)";
  const fallbackSelect =
    "id, title, artist_id, artist_name, description, cover_url, created_at, artists(name), album_tracks(*)";

  let albumRows: unknown[] | null = null;
  const first = await supabase
    .from("albums")
    .select(fullSelect)
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(80);
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

  const newReleases = albums.slice(0, 4);
  const collection = albums.slice(0, 48);

  const { data: artistRows } = await supabase.from("artists").select("*").limit(80);
  const artists = shuffleInPlace([...(artistRows ?? [])]) as DbArtist[];
  const featuredArtists = artists.slice(0, 5);

  const merch = await searchSaleProductsPaged(supabase, {
    category: "cd",
    from: 0,
    to: 7,
  });

  let magazine: MusicMagazineCard[] = [];
  const mag = await supabase
    .from("magazine_posts")
    .select("id, title, excerpt, cover_url, slug, category, status, show_on_music, published_at")
    .eq("show_on_music", true)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(6);
  if (!mag.error && mag.data) {
    magazine = mag.data.map((row) => ({
      id: row.id,
      title: row.title,
      excerpt: row.excerpt,
      cover_url: row.cover_url,
      slug: row.slug,
      category: row.category,
    }));
  }

  return (
    <>
      <Header />
      <main className="bg-[#050505]">
        <MusicHomeClient
          newReleases={newReleases}
          collection={collection}
          artists={featuredArtists}
          merch={merch.data}
          magazine={magazine}
        />
      </main>
      <Footer />
    </>
  );
}
