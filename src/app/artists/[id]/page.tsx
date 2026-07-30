import { Suspense } from "react";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AlbumCard } from "@/components/music/AlbumCard";
import { Pagination } from "@/components/ui/Pagination";
import { PageSizeSelect } from "@/components/ui/PageSizeSelect";
import { getAlbumsByArtistPaged, getArtistById } from "@/lib/artists";
import {
  getTotalPages,
  pageSizeParams,
  parsePage,
  parsePageSize,
} from "@/lib/pagination";

interface ArtistDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string; size?: string }>;
}

export default async function ArtistDetailPage({
  params,
  searchParams,
}: ArtistDetailPageProps) {
  const { id } = await params;
  const { page: pageParam, size: sizeParam } = await searchParams;
  const page = parsePage(pageParam);
  const pageSize = parsePageSize(sizeParam);

  const artist = await getArtistById(id);
  if (!artist) notFound();

  const { albums, count } = await getAlbumsByArtistPaged(artist, page, pageSize);
  const totalPages = getTotalPages(count, pageSize);

  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-16 pb-24 md:px-6">
        <Link
          href="/artists"
          className="mb-8 inline-flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted transition-colors hover:text-foreground"
        >
          ← 아티스트 목록
        </Link>

        <section className="grid gap-8 md:grid-cols-[220px_1fr] md:items-start">
          <div className="relative mx-auto aspect-square w-full max-w-[220px] overflow-hidden rounded-full bg-neutral-100">
            {artist.image_url ? (
              <Image
                src={artist.image_url}
                alt={artist.name}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-neutral-200 text-muted">
                <svg width="40" height="40" viewBox="0 0 32 32" fill="none">
                  <circle cx="16" cy="12" r="6" stroke="currentColor" strokeWidth="1.5" />
                  <path
                    d="M4 28c0-6.627 5.373-12 12-12s12 5.373 12 12"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                </svg>
              </div>
            )}
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted">Artist</p>
            <h1 className="mt-2 text-2xl font-semibold md:text-3xl">{artist.name}</h1>
            {artist.bio ? (
              <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                {artist.bio}
              </p>
            ) : (
              <p className="mt-4 text-sm text-muted">등록된 소개가 없습니다.</p>
            )}
          </div>
        </section>

        <section className="mt-14">
          <Suspense fallback={null}>
            <div className="mb-6">
              <PageSizeSelect />
            </div>
          </Suspense>
          <div className="mb-6">
            <p className="text-[10px] uppercase tracking-widest text-muted">Albums</p>
            <h2 className="mt-1 text-lg font-medium uppercase tracking-wider">앨범</h2>
          </div>

          {albums.length === 0 ? (
            <div className="border border-border px-6 py-12 text-center">
              <p className="text-sm text-muted">등록된 앨범이 없습니다.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {albums.map((album) => (
                <AlbumCard key={album.id} album={album} />
              ))}
            </div>
          )}

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            basePath={`/artists/${artist.id}`}
            params={pageSizeParams(pageSize)}
          />
        </section>
      </main>
      <Footer />
    </>
  );
}
