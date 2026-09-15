import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/home/Hero";
import { HomeMagazine } from "@/components/home/HomeMagazine";
import { HomeTicket } from "@/components/home/HomeTicket";
import { HomeThinkSticky } from "@/components/home/HomeThinkSticky";
import { HomeCollection } from "@/components/home/HomeCollection";
import { HomeStore } from "@/components/home/HomeStore";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { getAlbumArtistName } from "@/lib/albums";
import { formatThinkAuthorDisplay, type ThinkPostListItem } from "@/lib/think";
import type { ProductWithImages } from "@/lib/products";
import { isSoldOut } from "@/lib/products";
import { fetchSizeStockMaps } from "@/lib/productSizeStock";

async function getFeaturedTicket(): Promise<ProductWithImages | null> {
  try {
    const supabase = await createClient();
    const base = () =>
      supabase
        .from("products")
        .select("*, product_images(*)")
        .eq("category", "ticket")
        .eq("is_published", true)
        .eq("is_sale", true);

    const { data: featured } = await base()
      .eq("featured_on_home", true)
      .order("created_at", { ascending: false })
      .limit(5);

    const { data: latest } = await base()
      .order("created_at", { ascending: false })
      .limit(10);

    const candidates = [
      ...((featured as ProductWithImages[]) ?? []),
      ...((latest as ProductWithImages[]) ?? []),
    ];
    // 중복 제거
    const seen = new Set<string>();
    const unique = candidates.filter((p) => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });

    if (unique.length === 0) return null;

    const stockMaps = await fetchSizeStockMaps(
      supabase,
      unique.map((p) => p.id),
    );

    for (const product of unique) {
      const sizeStocks = stockMaps.get(product.id);
      const withStock = sizeStocks && Object.keys(sizeStocks).length > 0
        ? { ...product, sizeStocks }
        : product;
      if (!isSoldOut(withStock)) return withStock;
    }

    return null;
  } catch {
    return null;
  }
}

async function getHomeThinkPosts(): Promise<{ posts: ThinkPostListItem[]; total: number }> {
  try {
    const admin = createServiceClient() ?? (await createClient());
    const { data, count } = await admin
      .from("think_posts")
      .select("*", { count: "exact" })
      .eq("is_notice", false)
      .order("created_at", { ascending: false })
      .limit(8);

    const posts: ThinkPostListItem[] = (data ?? []).map((p) => ({
      ...p,
      author_display: formatThinkAuthorDisplay(p),
      comment_count: p.comment_count ?? 0,
    }));
    return { posts, total: count ?? posts.length };
  } catch {
    return { posts: [], total: 0 };
  }
}

async function getHomeAlbums() {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("albums")
      .select("id, title, cover_url, artist_name, artist_id, artists(name), created_at")
      .order("created_at", { ascending: false })
      .limit(10);

    return (data ?? []).map((album) => ({
      id: album.id as string,
      title: album.title as string,
      cover_url: (album.cover_url as string | null) ?? null,
      artist: getAlbumArtistName({
        artist_name:
          (album.artist_name as string | null) ||
          (Array.isArray(album.artists)
            ? (album.artists[0] as { name?: string } | undefined)?.name
            : (album.artists as { name?: string } | null)?.name) ||
          null,
      }),
    }));
  } catch {
    return [];
  }
}

async function getHomeStoreProducts(): Promise<ProductWithImages[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("products")
      .select("*, product_images(*)")
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(40);

    return (data ?? []) as ProductWithImages[];
  } catch {
    return [];
  }
}

export default async function Home() {
  const [ticket, think, albums, products] = await Promise.all([
    getFeaturedTicket(),
    getHomeThinkPosts(),
    getHomeAlbums(),
    getHomeStoreProducts(),
  ]);

  return (
    <>
      <Header />
      <main id="home-main" className="bg-[#0a0a0c]">
        <Hero />
        <HomeMagazine />
        <HomeTicket ticket={ticket} />
        <HomeThinkSticky posts={think.posts} totalCount={think.total} />
        <HomeCollection albums={albums} />
        <HomeStore products={products} />
      </main>
      <Footer />
    </>
  );
}
