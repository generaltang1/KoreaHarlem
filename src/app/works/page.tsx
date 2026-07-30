import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AlbumGrid } from "@/components/music/AlbumGrid";
import { Pagination } from "@/components/ui/Pagination";
import { PageSizeSelect } from "@/components/ui/PageSizeSelect";
import type { DbAlbum } from "@/lib/albums";
import {
  getRange,
  getTotalPages,
  pageSizeParams,
  parsePage,
  parsePageSize,
} from "@/lib/pagination";
import Image from "next/image";

const CATEGORY_LABELS: Record<string, string> = {
  music: "음악",
  visual: "시각 예술",
  performance: "공연",
  literature: "문학",
};

interface WorksPageProps {
  searchParams: Promise<{ category?: string; page?: string; size?: string }>;
}

export default async function WorksPage({ searchParams }: WorksPageProps) {
  const { category, page: pageParam, size: sizeParam } = await searchParams;
  const page = parsePage(pageParam);
  const pageSize = parsePageSize(sizeParam);
  const { from, to } = getRange(page, pageSize);
  const supabase = await createClient();
  const sizeQuery = pageSizeParams(pageSize, category ? { category } : undefined);

  if (category === "music") {
    const { data: albums, count } = await supabase
      .from("albums")
      .select("*, album_tracks(count)", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    const albumList: (DbAlbum & { track_count?: number })[] = (albums ?? []).map((album) => ({
      id: album.id,
      title: album.title,
      artist_id: album.artist_id,
      artist_name: album.artist_name,
      description: album.description,
      cover_url: album.cover_url,
      created_at: album.created_at,
      track_count: (album.album_tracks as { count: number }[] | null)?.[0]?.count ?? 0,
    }));
    const totalPages = getTotalPages(count ?? 0, pageSize);

    return (
      <>
        <Header />
        <main className="mx-auto max-w-7xl px-4 py-16 pb-28 md:px-6">
          <Suspense fallback={null}>
            <PageSizeSelect preserveParams={["category"]} />
          </Suspense>
          <div className="mb-10">
            <p className="text-[10px] uppercase tracking-widest text-muted">Music</p>
            <h1 className="mt-1 text-2xl font-medium uppercase tracking-wider">음악</h1>
          </div>
          <AlbumGrid albums={albumList} />
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            basePath="/works"
            params={sizeQuery}
          />
        </main>
        <Footer />
      </>
    );
  }

  let query = supabase
    .from("works")
    .select("*, artists(name)", { count: "exact" })
    .order("created_at", { ascending: false });

  if (category && category !== "music") {
    query = query.eq("category", category);
  }

  const { data: works, count } = await query.range(from, to);
  const totalPages = getTotalPages(count ?? 0, pageSize);
  const pageTitle =
    category && CATEGORY_LABELS[category]
      ? CATEGORY_LABELS[category]
      : "전체 작품";

  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-16 pb-24 md:px-6">
        <Suspense fallback={null}>
          <PageSizeSelect preserveParams={category ? ["category"] : []} />
        </Suspense>
        <div className="mb-10">
          <p className="text-[10px] uppercase tracking-widest text-muted">Works</p>
          <h1 className="mt-1 text-2xl font-medium uppercase tracking-wider">{pageTitle}</h1>
        </div>

        {!works || works.length === 0 ? (
          <div className="flex min-h-[40vh] items-center justify-center">
            <p className="text-sm text-muted">등록된 작품이 없습니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {works.map((work) => (
              <div key={work.id} className="group">
                <div className="relative aspect-[3/4] overflow-hidden bg-neutral-100">
                  {work.image_url ? (
                    <Image
                      src={work.image_url}
                      alt={work.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-neutral-200">
                      <span className="text-xs text-muted">
                        {CATEGORY_LABELS[work.category] ?? work.category}
                      </span>
                    </div>
                  )}
                </div>
                <div className="mt-3">
                  <p className="text-[10px] uppercase tracking-widest text-muted">
                    {CATEGORY_LABELS[work.category] ?? work.category}
                  </p>
                  <h3 className="mt-0.5 text-sm font-medium">{work.title}</h3>
                  {work.artists && (
                    <p className="text-xs text-muted">
                      {(work.artists as { name: string }).name}
                    </p>
                  )}
                  {work.price && (
                    <p className="mt-1 text-sm">₩{work.price.toLocaleString()}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <Pagination
          currentPage={page}
          totalPages={totalPages}
          basePath="/works"
          params={sizeQuery}
        />
      </main>
      <Footer />
    </>
  );
}
