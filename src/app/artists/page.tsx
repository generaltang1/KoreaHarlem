import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CommerceAtmosphere } from "@/components/mypage/CommerceAtmosphere";
import { Pagination } from "@/components/ui/Pagination";
import { PageSizeSelect } from "@/components/ui/PageSizeSelect";
import { searchArtistsPaged, type ArtistSearchRow } from "@/lib/albumSearch";
import {
  DEFAULT_PAGE_SIZE,
  getRange,
  getTotalPages,
  listParams,
  parsePage,
  parsePageSize,
} from "@/lib/pagination";
import { parseSearchQuery } from "@/lib/search";
import { searchSaleProductsPaged } from "@/lib/productSearch";
import { getProductImages, isSoldOut } from "@/lib/products";
import { formatKrwPrice } from "@/lib/musicCatalog";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

interface ArtistsPageProps {
  searchParams: Promise<{
    page?: string;
    size?: string;
    q?: string;
    genre?: string;
    idx?: string;
  }>;
}

/** Figma E-02 — 305:333 */
const FEATURED_COUNT = 10;
const MAX_GENRE_TABS = 6;

type ArtistMeta = { name: string; name_en: string | null; genre: string | null };

function hrefFor(opts: {
  q?: string;
  size?: number;
  genre?: string;
  idx?: string;
}) {
  const sp = new URLSearchParams();
  if (opts.q) sp.set("q", opts.q);
  if (opts.size && opts.size !== DEFAULT_PAGE_SIZE) sp.set("size", String(opts.size));
  if (opts.genre) sp.set("genre", opts.genre);
  if (opts.idx) sp.set("idx", opts.idx);
  const qs = sp.toString();
  return qs ? `/artists?${qs}` : "/artists";
}

function parseIdx(value?: string): string | undefined {
  const v = value?.trim();
  if (!v) return undefined;
  if (v === "ko") return "ko";
  return /^[a-z]$/i.test(v) ? v.toUpperCase() : undefined;
}

function firstLatin(meta: ArtistMeta): string | null {
  const source = (meta.name_en || meta.name || "").trim();
  const ch = source.charAt(0).toUpperCase();
  return /^[A-Z]$/.test(ch) ? ch : null;
}

function isHangulStart(name: string): boolean {
  const code = name.trim().charCodeAt(0);
  return code >= 0xac00 && code <= 0xd7a3;
}

const tabBase =
  "px-[10px] py-[4px] text-[11px] font-semibold uppercase leading-[14px] tracking-[0.88px] transition-colors [font-family:var(--font-f-display),var(--font-f-sans),sans-serif]";

function ArtistCard({ artist }: { artist: ArtistSearchRow }) {
  const genre = artist.genre?.trim();
  return (
    <Link
      href={`/artists/${artist.id}`}
      className="group relative flex min-w-0 flex-col border border-[#262626] bg-[#151515] p-[10px] transition-colors hover:border-[#3d3d3d]"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-[#f4f1ea]">
        {artist.image_url ? (
          <Image
            src={artist.image_url}
            alt={artist.name}
            fill
            sizes="(min-width: 1024px) 180px, 45vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-[#151515] text-[#6e6b65]">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden>
              <circle cx="16" cy="12" r="6" stroke="currentColor" strokeWidth="1.5" />
              <path d="M4 28c0-6.627 5.373-12 12-12s12 5.373 12 12" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </div>
        )}
      </div>
      <h3 className="mt-[18px] truncate text-center text-[14px] font-medium leading-[22px] text-[#f4f1ea]">
        {artist.name}
      </h3>
      <p className="truncate text-center text-[11px] leading-[16.5px] text-[#a8a49b] [font-family:var(--font-f-display),var(--font-f-sans),sans-serif]">
        {artist.name_en || "\u00A0"}
      </p>
      <div className="mt-1 flex min-h-[23px] justify-center pt-1">
        {genre ? (
          <span className="max-w-full truncate bg-[#151515] px-1.5 py-0.5 text-[10px] leading-[15px] text-[#f4f1ea] [font-family:var(--font-f-display),var(--font-f-sans),sans-serif]">
            {genre}
          </span>
        ) : null}
      </div>
    </Link>
  );
}

function SectionHead({ title, meta }: { title: string; meta: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#262626] bg-[#151515] px-4 pb-[9px] pt-2">
      <h2 className="text-[20px] font-medium leading-7 text-[#f4f1ea] [font-family:var(--font-f-display),var(--font-f-sans),sans-serif]">
        {title}
      </h2>
      <p className="text-[11px] leading-[14px] tracking-[0.44px] text-[#a8a49b] [font-family:var(--font-f-display),var(--font-f-sans),sans-serif]">
        {meta}
      </p>
    </div>
  );
}

export default async function ArtistsPage({ searchParams }: ArtistsPageProps) {
  const {
    page: pageParam,
    size: sizeParam,
    q: qParam,
    genre: genreParam,
    idx: idxParam,
  } = await searchParams;
  const page = parsePage(pageParam);
  const pageSize = parsePageSize(sizeParam);
  const q = parseSearchQuery(qParam);
  const genre = genreParam?.trim() || undefined;
  const idx = parseIdx(idxParam);
  const { from, to } = getRange(page, pageSize);

  const supabase = await createClient();

  const [{ data: artists, count }, metaRes, pickRes, merch] = await Promise.all([
    searchArtistsPaged(supabase, {
      q,
      from,
      to,
      genre,
      initial: idx,
    }),
    supabase.from("artists").select("name, name_en, genre").limit(1000),
    supabase
      .from("artists")
      .select("id, name, name_en, genre, image_url")
      .order("created_at", { ascending: false })
      .limit(4),
    searchSaleProductsPaged(supabase, { category: "cd", from: 0, to: 2 }),
  ]);

  const totalPages = getTotalPages(count, pageSize);

  const allMeta = (metaRes.data ?? []) as ArtistMeta[];
  const genreCounts = new Map<string, number>();
  const letters = new Set<string>();
  let hasHangul = false;
  for (const m of allMeta) {
    const g = m.genre?.trim();
    if (g) genreCounts.set(g, (genreCounts.get(g) ?? 0) + 1);
    const letter = firstLatin(m);
    if (letter) letters.add(letter);
    if (isHangulStart(m.name ?? "")) hasHangul = true;
  }
  const genreTabs = [...genreCounts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ko"))
    .slice(0, MAX_GENRE_TABS)
    .map(([name]) => name);
  const letterList = [...letters].sort();

  const picks = (pickRes.data ?? []) as Pick<
    ArtistSearchRow,
    "id" | "name" | "name_en" | "genre" | "image_url"
  >[];

  const featured = (artists ?? []).slice(0, FEATURED_COUNT);
  const archive = (artists ?? []).slice(FEATURED_COUNT);

  const keep = { q, size: pageSize };
  const paginationParams = {
    ...listParams({ pageSize, q }),
    genre,
    idx,
  };

  const filtered = Boolean(q || genre || idx);

  return (
    <>
      <Header />
      <CommerceAtmosphere>
        <div className="mx-auto w-full max-w-[1440px] px-4 pb-28 md:px-8 lg:px-12">
          {/* Section — Top Curatorial Banner / Intro Context */}
          <section className="flex flex-col gap-10 py-10">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span aria-hidden className="size-2 bg-[#f87171]" />
                <span className="text-[11px] uppercase leading-[14px] tracking-[1.1px] text-[#6e6b65] [font-family:var(--font-f-display),var(--font-f-sans),sans-serif]">
                  /
                </span>
              </div>
              <h1 className="text-[36px] font-bold uppercase leading-[44px] tracking-[-1.2px] text-[#f4f1ea] md:text-[48px] md:leading-[56px]">
                아티스트
              </h1>
              {q ? (
                <p className="mt-2 text-xs text-[#a8a49b]">
                  “{q}” 검색 결과 {count}건
                </p>
              ) : null}
            </div>

            <div className="flex flex-col gap-4 pt-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <form
                  action="/artists"
                  method="get"
                  role="search"
                  className="relative w-full lg:w-[384px]"
                >
                  {genre ? <input type="hidden" name="genre" value={genre} /> : null}
                  {idx ? <input type="hidden" name="idx" value={idx} /> : null}
                  {pageSize !== DEFAULT_PAGE_SIZE ? (
                    <input type="hidden" name="size" value={pageSize} />
                  ) : null}
                  <input
                    type="search"
                    name="q"
                    defaultValue={q ?? ""}
                    placeholder="아티스트명, 장르, 로케이션 검색 (Search name, genre, city)..."
                    aria-label="아티스트 검색"
                    className="w-full bg-[#151515] pb-2.5 pl-3 pr-9 pt-[9px] text-[12px] text-[#f4f1ea] outline-none placeholder:text-[#a8a49b] focus:ring-1 focus:ring-[#3d3d3d]"
                  />
                  <button
                    type="submit"
                    aria-label="검색"
                    className="absolute right-[10px] top-[10px] text-[#a8a49b] hover:text-[#f4f1ea]"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                      <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.3" />
                      <path d="M9.5 9.5L13 13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                    </svg>
                  </button>
                </form>

                <nav aria-label="장르 필터" className="flex flex-wrap items-center gap-1.5 pb-1">
                  <Link
                    href={hrefFor({ ...keep, idx })}
                    className={`${tabBase} ${
                      !genre ? "bg-[#f4f1ea] text-[#0a0a0a]" : "bg-[#151515] text-[#a8a49b] hover:text-[#f4f1ea]"
                    }`}
                  >
                    ALL [{allMeta.length}]
                  </Link>
                  {genreTabs.map((g) => (
                    <Link
                      key={g}
                      href={hrefFor({ ...keep, genre: g, idx })}
                      className={`${tabBase} ${
                        genre === g
                          ? "bg-[#f4f1ea] text-[#0a0a0a]"
                          : "bg-[#151515] text-[#a8a49b] hover:text-[#f4f1ea]"
                      }`}
                    >
                      {g}
                    </Link>
                  ))}
                </nav>
              </div>

              <nav
                aria-label="인덱스 점프"
                className="flex items-center gap-1 overflow-x-auto bg-[#151515] py-1 [font-family:var(--font-f-display),var(--font-f-sans),sans-serif]"
              >
                <span className="pr-2 pl-1 text-[11px] font-semibold uppercase leading-[14px] tracking-[0.88px] text-[#f4f1ea]">
                  INDEX:
                </span>
                <Link
                  href={hrefFor({ ...keep, genre })}
                  className={`px-1.5 py-0.5 text-[11px] leading-[14px] tracking-[0.44px] ${
                    !idx ? "text-[#f4f1ea]" : "text-[#a8a49b] hover:text-[#f4f1ea]"
                  }`}
                >
                  전체
                </Link>
                <span className="text-[11px] leading-[14px] text-[#6e6b65]">/</span>
                {letterList.map((letter) => (
                  <Link
                    key={letter}
                    href={hrefFor({ ...keep, genre, idx: letter })}
                    className={`px-1.5 py-0.5 text-[11px] leading-[14px] tracking-[0.44px] ${
                      idx === letter ? "text-[#f4f1ea]" : "text-[#a8a49b] hover:text-[#f4f1ea]"
                    }`}
                  >
                    {letter}
                  </Link>
                ))}
                {hasHangul ? (
                  <>
                    <span className="text-[11px] leading-[14px] text-[#6e6b65]">/</span>
                    <Link
                      href={hrefFor({ ...keep, genre, idx: "ko" })}
                      className={`px-1.5 py-0.5 text-[11px] font-medium leading-[14px] tracking-[0.44px] ${
                        idx === "ko" ? "text-[#FEE500]" : "text-[#fbc201] hover:text-[#FEE500]"
                      }`}
                    >
                      ㄱ—ㅎ (한글색인)
                    </Link>
                  </>
                ) : null}
              </nav>
            </div>
          </section>

          {/* Section — Main Dual-Column Content Arena */}
          <section className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_291px]">
            <div className="flex min-w-0 flex-col gap-10">
              {!artists || artists.length === 0 ? (
                <div className="flex min-h-[40vh] items-center justify-center border border-[#262626] bg-[#151515]">
                  <p className="text-sm text-[#a8a49b]">
                    {filtered ? "검색 결과가 없습니다." : "등록된 아티스트가 없습니다."}
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex flex-col gap-4">
                    <SectionHead
                      title="A — Z ARTISTS"
                      meta={`${featured.length} FEATURED ACTS // COMPACT DIRECTORY`}
                    />
                    <div className="mt-1 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
                      {featured.map((artist) => (
                        <ArtistCard key={artist.id} artist={artist} />
                      ))}
                    </div>
                  </div>

                  {archive.length > 0 ? (
                    <div className="flex flex-col gap-4">
                      <SectionHead
                        title="ㄱ—ㅎ 색인 (Hangul Archive)"
                        meta={`${archive.length} ARCHIVE PRESSINGS`}
                      />
                      <div className="mt-1 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
                        {archive.map((artist) => (
                          <ArtistCard key={artist.id} artist={artist} />
                        ))}
                      </div>
                    </div>
                  ) : null}
                </>
              )}

              <div className="flex flex-col items-center gap-4">
                <Suspense fallback={<div className="h-8" />}>
                  <PageSizeSelect tone="dark" preserveParams={["genre", "idx"]} />
                </Suspense>
                <Pagination
                  tone="dark"
                  currentPage={page}
                  totalPages={totalPages}
                  basePath="/artists"
                  params={paginationParams}
                />
              </div>
            </div>

            <aside className="flex min-w-0 flex-col gap-4">
              {/* CURATED PICKS */}
              <div className="flex flex-col gap-2 border border-[#262626] bg-[#151515] p-[17px]">
                <div className="flex items-center justify-between border-b border-[#262626] pb-[9px]">
                  <h2 className="text-[11px] font-bold uppercase leading-[14px] tracking-[1.1px] text-[#f4f1ea]">
                    CURATED PICKS // 추천 아티스트
                  </h2>
                  <span aria-hidden className="size-2 rounded-full bg-[#f87171]" />
                </div>
                <div className="flex flex-col gap-1">
                  {picks.length === 0 ? (
                    <p className="p-2 text-[12px] text-[#a8a49b]">등록된 아티스트가 없습니다.</p>
                  ) : (
                    picks.map((pick) => (
                      <Link
                        key={pick.id}
                        href={`/artists/${pick.id}`}
                        className="flex items-center justify-between gap-2 p-2 transition-colors hover:bg-[rgba(244,241,234,0.04)]"
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <div className="relative size-9 shrink-0 overflow-hidden border border-[#262626] bg-[#f4f1ea] p-px">
                            {pick.image_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={pick.image_url} alt="" className="h-full w-full object-cover" />
                            ) : null}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-[13px] font-medium leading-4 tracking-[0.26px] text-[#f4f1ea]">
                              {pick.name_en ? `${pick.name} (${pick.name_en})` : pick.name}
                            </p>
                            <p className="truncate text-[11px] leading-[16.5px] text-[#a8a49b] [font-family:var(--font-f-display),var(--font-f-sans),sans-serif]">
                              {pick.genre || "—"}
                            </p>
                          </div>
                        </div>
                        <svg width="11" height="11" viewBox="0 0 11 11" fill="none" className="shrink-0 text-[#a8a49b]" aria-hidden>
                          <path d="M2.5 8.5l6-6M3.5 2.5h5v5" stroke="currentColor" strokeWidth="1" />
                        </svg>
                      </Link>
                    ))
                  )}
                </div>
              </div>

              {/* MUSIC MERCH */}
              <div className="flex flex-col gap-2 border border-[#262626] bg-[#151515] p-[17px]">
                <div className="flex items-center justify-between border-b border-[#262626] pb-[9px]">
                  <div className="flex items-center gap-1.5">
                    <span aria-hidden className="size-1.5 rounded-full bg-[#f87171]" />
                    <h2 className="text-[11px] font-bold uppercase leading-[14px] tracking-[1.1px] text-[#f4f1ea]">
                      MUSIC MERCH // 공식 머치
                    </h2>
                  </div>
                  <Link href="/sale?category=cd" className="text-[10px] leading-[15px] text-[#a8a49b] hover:text-[#f4f1ea]">
                    스토어 보기 →
                  </Link>
                </div>
                <div className="flex flex-col gap-1">
                  {merch.data.length === 0 ? (
                    <p className="p-2 text-[12px] text-[#a8a49b]">등록된 머치가 없습니다.</p>
                  ) : (
                    merch.data.slice(0, 3).map((product) => {
                      const img = getProductImages(product)[0];
                      const soldOut = isSoldOut(product);
                      return (
                        <Link
                          key={product.id}
                          href={`/sale/${product.id}`}
                          className="flex gap-2.5 border border-[#262626] p-[9px] transition-colors hover:border-[#3d3d3d]"
                        >
                          <div className="relative size-14 shrink-0 overflow-hidden border border-[#262626] bg-[#f4f1ea] p-px">
                            {img ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={img} alt="" className="h-full w-full object-cover" />
                            ) : null}
                          </div>
                          <div className="flex min-w-0 flex-1 flex-col">
                            <div className="flex items-center justify-between gap-2">
                              <span className="truncate text-[9px] uppercase leading-[13.5px] tracking-[0.45px] text-[#fbc201] [font-family:var(--font-f-display),var(--font-f-sans),sans-serif]">
                                {product.category}
                              </span>
                              <span className="shrink-0 text-[11px] font-semibold leading-[16.5px] text-[#f4f1ea] [font-family:var(--font-f-display),var(--font-f-sans),sans-serif]">
                                {formatKrwPrice(product.price_krw)}
                              </span>
                            </div>
                            <p className="truncate pt-0.5 text-[13px] font-medium leading-4 tracking-[0.26px] text-[#f4f1ea]">
                              {product.title}
                            </p>
                            {product.title_en ? (
                              <p className="truncate text-[10px] leading-[15px] text-[#a8a49b] [font-family:var(--font-f-display),var(--font-f-sans),sans-serif]">
                                {product.title_en}
                              </p>
                            ) : null}
                            <div className="mt-auto flex items-center justify-between pt-1.5">
                              <span className="text-[9px] leading-[13.5px] text-[#a8a49b]">
                                {soldOut ? "품절" : "재고 있음"}
                              </span>
                              <span className="bg-[#151515] px-2 py-0.5 text-[10px] font-medium uppercase leading-[15px] tracking-[0.5px] text-[#a8a49b]">
                                담기 +
                              </span>
                            </div>
                          </div>
                        </Link>
                      );
                    })
                  )}
                </div>
              </div>
            </aside>
          </section>
        </div>
      </CommerceAtmosphere>
      <Footer />
    </>
  );
}
