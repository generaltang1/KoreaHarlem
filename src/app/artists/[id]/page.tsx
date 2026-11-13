import { notFound } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import {
  ArtistDetailClient,
  type ArtistAlbumWithTracks,
  type ArtistMagazineCard,
  type ArtistMerchCard,
  type ArtistPublic,
} from "@/components/music/ArtistDetailClient";
import { CommerceAtmosphere } from "@/components/mypage/CommerceAtmosphere";
import { searchSaleProductsPaged } from "@/lib/productSearch";
import { getProductImages, isSoldOut } from "@/lib/products";
import { toIlikePattern } from "@/lib/search";
import { createClient } from "@/lib/supabase/server";
import { publishDueAlbums } from "@/lib/albumPublish";

export const dynamic = "force-dynamic";

interface ArtistDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ArtistDetailPage({ params }: ArtistDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  await publishDueAlbums(supabase);

  const { data: artistRow } = await supabase.from("artists").select("*").eq("id", id).maybeSingle();
  if (!artistRow) notFound();

  const artist: ArtistPublic = {
    id: artistRow.id,
    name: artistRow.name,
    name_en: artistRow.name_en ?? null,
    agency: artistRow.agency ?? null,
    activity_type: artistRow.activity_type ?? null,
    debut_date: artistRow.debut_date ?? null,
    bio: artistRow.bio,
    image_url: artistRow.image_url,
    genre: artistRow.genre ?? null,
    instagram_url: artistRow.instagram_url ?? null,
    youtube_url: artistRow.youtube_url ?? null,
    website_url: artistRow.website_url ?? null,
  };

  type AlbumRow = {
    id: string;
    title: string;
    cover_url: string | null;
    created_at: string;
    album_type?: string | null;
    release_date?: string | null;
    album_tracks?: ArtistAlbumWithTracks["album_tracks"];
  };

  let albumRows: AlbumRow[] = [];
  const published = await supabase
    .from("albums")
    .select("*, album_tracks(*)")
    .eq("artist_id", id)
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  if (published.error) {
    const fallback = await supabase
      .from("albums")
      .select("*, album_tracks(*)")
      .eq("artist_id", id)
      .order("created_at", { ascending: false });
    albumRows = (fallback.data ?? []) as AlbumRow[];
  } else {
    albumRows = (published.data ?? []) as AlbumRow[];
  }

  if (albumRows.length === 0 && artist.name) {
    const byName = await supabase
      .from("albums")
      .select("*, album_tracks(*)")
      .eq("artist_name", artist.name)
      .order("created_at", { ascending: false });
    albumRows = (byName.data ?? []) as AlbumRow[];
  }

  const albums: ArtistAlbumWithTracks[] = albumRows.map((row) => ({
    id: row.id,
    title: row.title,
    cover_url: row.cover_url,
    created_at: row.created_at,
    album_type: row.album_type ?? null,
    release_date: row.release_date ?? null,
    album_tracks: [...(row.album_tracks ?? [])].sort(
      (a, b) => a.track_order - b.track_order,
    ),
  }));

  // 관련 매거진 (#아티스트 태그 → 제목/요약에 아티스트명 포함)
  let magazine: ArtistMagazineCard[] = [];
  if (artist.name) {
    const pattern = toIlikePattern(artist.name);
    const mag = await supabase
      .from("magazine_posts")
      .select("id, title, cover_url, published_at, category")
      .eq("status", "published")
      .or(`title.ilike."${pattern}",excerpt.ilike."${pattern}"`)
      .order("published_at", { ascending: false })
      .limit(2);
    if (!mag.error && mag.data) magazine = mag.data as ArtistMagazineCard[];
  }

  // 관련 머천 (상품명에 아티스트명 포함)
  let merch: ArtistMerchCard[] = [];
  if (artist.name) {
    const res = await searchSaleProductsPaged(supabase, { q: artist.name, from: 0, to: 1 });
    merch = res.data.slice(0, 2).map((p) => ({
      id: p.id,
      title: p.title,
      price_krw: p.price_krw,
      image: getProductImages(p)[0] ?? null,
      soldOut: isSoldOut(p),
    }));
  }

  return (
    <>
      <Header />
      <CommerceAtmosphere>
        <ArtistDetailClient artist={artist} albums={albums} magazine={magazine} merch={merch} />
      </CommerceAtmosphere>
      <Footer />
    </>
  );
}
