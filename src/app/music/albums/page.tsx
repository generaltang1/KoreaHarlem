import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AlbumsArchiveClient } from "@/components/music/AlbumsArchiveClient";
import { createClient } from "@/lib/supabase/server";
import { publishDueAlbums } from "@/lib/albumPublish";
import { mapAlbumRow, type MusicAlbumCard } from "@/lib/musicCatalog";

export const dynamic = "force-dynamic";

export default async function MusicAlbumsPage() {
  const supabase = await createClient();
  await publishDueAlbums(supabase);

  const select =
    "id, title, artist_id, artist_name, description, cover_url, digital_price_krw, created_at, is_published, scheduled_publish_at, artists(name), album_tracks(*)";

  let rows: unknown[] | null = null;
  const published = await supabase
    .from("albums")
    .select(select)
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(200);

  if (published.error) {
    const fallback = await supabase
      .from("albums")
      .select(
        "id, title, artist_id, artist_name, description, cover_url, digital_price_krw, created_at, artists(name), album_tracks(*)",
      )
      .order("created_at", { ascending: false })
      .limit(200);
    rows = fallback.data;
  } else {
    rows = published.data;
  }

  const albums: MusicAlbumCard[] = (rows ?? []).map((row) =>
    mapAlbumRow(row as Parameters<typeof mapAlbumRow>[0]),
  );

  return (
    <>
      <Header />
      <AlbumsArchiveClient albums={albums} />
      <Footer />
    </>
  );
}
