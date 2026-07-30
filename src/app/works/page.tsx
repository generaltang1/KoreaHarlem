import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AlbumGrid } from "@/components/music/AlbumGrid";
import { Pagination } from "@/components/ui/Pagination";
import { ListToolbar } from "@/components/ui/ListToolbar";
import { PageSizeSelect } from "@/components/ui/PageSizeSelect";
import { searchAlbumsPaged } from "@/lib/albumSearch";
import type { DbAlbum } from "@/lib/albums";
import {
  getRange,
  getTotalPages,
  listParams,
  parsePage,
  parsePageSize,
} from "@/lib/pagination";
import { parseSearchQuery } from "@/lib/search";
import Image from "next/image";
import { Suspense } from "react";

const CATEGORY_LABELS: Record<string, string> = {
  music: "음악",
  visual: "시각 예술",
  performance: "공연",
  literature: "문학",
};

interface WorksPageProps {
  searchParams: Promise<{ category?: string; page?: string; size?: string; q?: string }>;
}

export default async function WorksPage({ searchParams }: WorksPageProps) {
  const { category, page: pageParam, size: sizeParam, q: qParam } = await searchParams;
  const page = parsePage(pageParam);
  const pageSize = parsePageSize(sizeParam);
  const q = parseSearchQuery(qParam);
  const { from, to } = getRange(page, pageSize);
  const supabase = await createClient();

  if (category === "music") {
    const { data: albums, count } = await searchAlbumsPaged(supabase, {
      q,
      from,
      to,
    });

    const albumList: (DbAlbum & { track_count?: number })[] = albums.map((album) => ({
      id: album.id,
      title: album.title,
      artist_id: album.artist_id,
      artist_name: album.artist_name,
      description: album.description,
      cover_url: album.cover_url,
      created_at: album.created_at,
      track_count: album.album_tracks?.[0]?.count ?? 0,
    }));
    const totalPages = getTotalPages(count, pageSize);

    return (
      <>
        <Header />
        <main className="mx-auto max-w-7xl px-4 py-16 pb-28 md:px-6">
          <ListToolbar
            searchPlaceholder="아티스트명, 앨범제목, 곡제목 검색"
            preserveParams={["size", "category", "q"]}
          />
          <div className="mb-10">
            <p className="text-[10px] uppercase tracking-widest text-muted">Music</p>
            <h1 className="mt-1 text-2xl font-medium uppercase tracking-wider">음악</h1>
            {q && (
              <p className="mt-2 text-xs text-muted">
                “{q}” 검색 결과 {count}건
              </p>
            )}
          </div>
          {albumList.length === 0 ? (
            <div className="flex min-h-[30vh] items-center justify-center">
              <p className="text-sm text-muted">
                {q ? "검색 결과가 없습니다." : "등록된 앨범이 없습니다."}
              </p>
            </div>
          ) : (
            <AlbumGrid albums={albumList} />
          )}
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            basePath="/works"
            params={listParams({ pageSize, q, category: "music" })}
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
          <div className="mb-6">
            <PageSizeSelect preserveParams={category ? ["category"] : []} />
          </div>
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
          params={listParams({ pageSize, category })}
        />
      </main>
      <Footer />
    </>
  );
}
