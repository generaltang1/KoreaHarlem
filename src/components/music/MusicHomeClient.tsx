"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { useDjSet } from "@/context/DjSetContext";
import { usePlayer } from "@/context/PlayerContext";
import { formatTrackDuration, isPricedForSale } from "@/lib/albums";
import {
  albumDateLabel,
  formatKrwPrice,
  type MusicAlbumCard,
} from "@/lib/musicCatalog";
import { cardTracksToPlayerQueue } from "@/lib/musicPlay";
import { music as m } from "@/lib/musicTheme";
import type { ProductWithImages } from "@/lib/products";
import { getProductImages } from "@/lib/products";
import type { DbArtist } from "@/lib/artists";
import { magazinePublicPath } from "@/lib/magazine";

export type MusicHomeMagazine = {
  id: string;
  title: string;
  excerpt: string | null;
  cover_url: string | null;
  slug: string | null;
  category: string | null;
};

type MusicHomeClientProps = {
  newReleases: MusicAlbumCard[];
  collection: MusicAlbumCard[];
  artists: DbArtist[];
  merch: ProductWithImages[];
  magazine?: MusicHomeMagazine[];
};

type SortMode = "newest" | "title";
type PeriodMode = "all" | "month";

function formatClock(sec: number) {
  if (!Number.isFinite(sec) || sec < 0) return "00:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function SectionHead({
  kicker,
  title,
  href,
  linkLabel,
  meta,
}: {
  kicker: string;
  title: string;
  href?: string;
  linkLabel?: string;
  meta?: string;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3 pb-1">
      <div className="flex flex-col gap-2">
        <p className="font-mono text-[11px] font-medium tracking-[1.4px] text-[#FBC201]">{kicker}</p>
        <h2 className="text-[24px] font-black tracking-[-0.6px] text-[#f4f1ea] md:text-[28px]">{title}</h2>
      </div>
      {href && linkLabel ? (
        <Link href={href} className="text-[13px] font-medium text-[#a8a49b] transition hover:text-[#f4f1ea]">
          {linkLabel}
        </Link>
      ) : meta ? (
        <span className="font-mono text-[13px] text-[#a8a49b]">{meta}</span>
      ) : null}
    </div>
  );
}

export function MusicHomeClient({
  newReleases,
  collection,
  artists,
  merch,
  magazine = [],
}: MusicHomeClientProps) {
  const albumsById = useMemo(() => {
    const map = new Map<string, MusicAlbumCard>();
    for (const album of [...newReleases, ...collection]) map.set(album.id, album);
    return map;
  }, [newReleases, collection]);

  const [selectedId, setSelectedId] = useState(
    collection[0]?.id ?? newReleases[0]?.id ?? "",
  );
  const [playRequest, setPlayRequest] = useState(0);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortMode>("newest");
  const [period, setPeriod] = useState<PeriodMode>("all");
  const [visible, setVisible] = useState(12);

  const selected = albumsById.get(selectedId) ?? collection[0] ?? newReleases[0] ?? null;

  const selectAlbum = (id: string, play = false) => {
    setSelectedId(id);
    if (play) setPlayRequest((n) => n + 1);
  };

  const filteredCollection = useMemo(() => {
    const q = query.trim().toLowerCase();
    const monthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    let list = [...collection];
    if (period === "month") {
      list = list.filter((a) => new Date(a.created_at).getTime() >= monthAgo);
    }
    if (q) {
      list = list.filter(
        (album) =>
          album.title.toLowerCase().includes(q) ||
          album.artist.toLowerCase().includes(q) ||
          album.tracks.some((track) => track.title.toLowerCase().includes(q)),
      );
    }
    list.sort((a, b) => {
      if (sort === "title") return a.title.localeCompare(b.title, "ko");
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    return list;
  }, [collection, query, sort, period]);

  const shown = filteredCollection.slice(0, visible);

  return (
    <div className={`relative overflow-hidden ${m.page} ${m.font}`}>
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(ellipse 40% 30% at 50% 20%, rgba(30,41,59,0.4), transparent), radial-gradient(ellipse 35% 28% at 15% 70%, rgba(20,25,35,0.55), transparent), radial-gradient(ellipse 30% 25% at 85% 60%, rgba(25,20,35,0.45), transparent)",
          }}
        />
        <Image
          src="/figma/f-atmosphere/pin-prick-stars.svg"
          alt=""
          fill
          className="object-cover opacity-80"
          unoptimized
        />
        <Image
          src="/figma/f-atmosphere/anamorphic-lights.svg"
          alt=""
          fill
          className="object-cover opacity-70"
          unoptimized
        />
        <div className="absolute left-[8%] top-[12%] h-[1.5px] w-[210px] rotate-[-18deg] bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.28)] to-[rgba(255,255,255,0.9)] shadow-[0_0_6px_rgba(199,214,245,0.6)]" />
        <div className="absolute left-[48%] top-[6%] h-[1.5px] w-[160px] rotate-[-22deg] bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.2)] to-[rgba(255,255,255,0.7)] shadow-[0_0_6px_rgba(199,214,245,0.6)]" />
      </div>

      <div className="relative mx-auto flex w-full max-w-[1280px] flex-col gap-14 px-4 pb-28 pt-10 sm:gap-[72px] sm:px-8 md:px-10 lg:px-14">
        <HeroSelects />

        <NewReleasesSection
          albums={newReleases.slice(0, 4)}
          onPlay={(id) => selectAlbum(id, true)}
        />

        <section id="collection">
          <SectionHead
            kicker="02  /  COLLECTION · 전체 컬렉션"
            title="전체 음반"
            meta={`${String(filteredCollection.length).padStart(2, "0")} RELEASES`}
          />

          <div className="mb-5 flex flex-col gap-3 rounded-[10px] bg-[#151515] px-4 py-3.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-5">
            <label className="flex items-center gap-2 text-[13px] text-[#f4f1ea]">
              <span className="text-[#6e6b65]">↕</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortMode)}
                className="cursor-pointer border-0 bg-transparent outline-none"
              >
                <option value="newest">최신 등록순</option>
                <option value="title">제목순</option>
              </select>
            </label>
            <label className="flex items-center gap-2 text-[13px] text-[#f4f1ea]">
              <span className="text-[#6e6b65]">◷</span>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as PeriodMode)}
                className="cursor-pointer border-0 bg-transparent outline-none"
              >
                <option value="all">전체 기간</option>
                <option value="month">이번 달 새로 들어옴</option>
              </select>
            </label>
            <span className="hidden text-[13px] text-[#6e6b65] lg:inline">◉  DIGITAL</span>
            <span className="hidden text-[13px] text-[#6e6b65] xl:inline"># 장르 칩 · 추후</span>
            <div className="min-w-[160px] flex-1">
              <input
                type="search"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setVisible(12);
                }}
                placeholder="아티스트, 앨범, 트랙 검색..."
                className="w-full rounded-[8px] border border-[#2a2a2a] bg-[#0c0c0c] px-3 py-2 text-xs text-[#f4f1ea] outline-none placeholder:text-[#6e6b65] focus:border-[#FBC201]"
              />
            </div>
            <div className="flex flex-wrap gap-3 font-mono text-[11px] uppercase tracking-wider">
              <Link href="/music/albums" className="text-[#FBC201] hover:underline">
                Albums archive →
              </Link>
              <Link href="/music/dj-set" className="text-[#a8a49b] hover:text-white">
                DJ SET →
              </Link>
              {(query || period !== "all" || sort !== "newest") && (
                <button
                  type="button"
                  className="text-[#6e6b65] hover:text-[#f4f1ea]"
                  onClick={() => {
                    setQuery("");
                    setPeriod("all");
                    setSort("newest");
                    setVisible(12);
                  }}
                >
                  필터 모두 지우기
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
            <div className="lg:col-span-7 xl:col-span-7">
              {shown.length === 0 ? (
                <p className={`text-sm ${m.muted}`}>표시할 앨범이 없습니다.</p>
              ) : (
                <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-3 xl:grid-cols-4">
                  {shown.map((album) => {
                    const active = selected?.id === album.id;
                    return (
                      <button
                        key={album.id}
                        type="button"
                        onClick={() => selectAlbum(album.id)}
                        className="group flex flex-col gap-1.5 text-left"
                      >
                        <div
                          className={`relative aspect-square w-full overflow-hidden bg-[#151515] ${
                            active ? "border-2 border-[#FBC201]" : "border border-transparent"
                          }`}
                        >
                          {album.cover_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={album.cover_url}
                              alt={album.title}
                              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-[11px] text-[#6e6b65]">
                              커버 자리
                            </div>
                          )}
                        </div>
                        <p className="line-clamp-2 text-[13px] font-bold leading-snug text-[#f4f1ea]">
                          {album.title}
                        </p>
                        <p className="truncate text-[12px] text-[#a8a49b]">by {album.artist}</p>
                      </button>
                    );
                  })}
                </div>
              )}
              {visible < filteredCollection.length && (
                <div className="mt-8 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setVisible((n) => n + 12)}
                    className="text-[13px] font-medium text-[#a8a49b] transition hover:text-[#f4f1ea]"
                  >
                    더 불러오기
                  </button>
                </div>
              )}
            </div>
            <div className="lg:col-span-5">
              <div className="hidden h-full w-px bg-[#262626] lg:absolute" />
              <CollectionPlayer album={selected} playRequest={playRequest} />
            </div>
          </div>
        </section>

        <ArtistsStrip artists={artists} />
        <MagazineMusicStrip posts={magazine} />
        <CdVinylStrip products={merch} />
      </div>
    </div>
  );
}

function HeroSelects() {
  const { current, isPlaying } = useDjSet();
  const title = current?.title ?? "DJ SET";
  const artist = current?.artist ?? "ON AIR";

  return (
    <section className="flex flex-col items-stretch gap-8 lg:flex-row lg:items-end lg:justify-between lg:gap-8">
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <p className="font-mono text-[12px] font-medium tracking-[1.5px] text-[#FBC201]">
          MUSIC / 코리아할렘 셀렉츠
        </p>
        <h1 className="text-[36px] font-black leading-none tracking-[-2px] text-[#f4f1ea] sm:text-[48px] md:text-[56px]">
          코리아할렘 셀렉츠
        </h1>
        <p className="max-w-xl text-[15px] leading-6 text-[#a8a49b]">
          한국 음반을 고르고, 듣고, 소장하는 곳. 스트리밍은 누구나 무료, 다운로드는 구매 후 MY MUSIC에서
          받아요.
        </p>
      </div>

      <div className="flex shrink-0 flex-col gap-3 rounded-[14px] border border-[rgba(251,194,1,0.3)] bg-[#151515] p-4 sm:flex-row sm:items-center sm:gap-3.5">
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-[8px] bg-[#0a0a0a]">
          {current?.cover_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={current.cover_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center bg-[#FBC201] font-black text-[#0a0a0a]">
              KH
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-1.5">
            <span
              className={`h-2 w-2 rounded-full ${isPlaying ? "animate-pulse bg-[#FBC201]" : "bg-[#6e6b65]"}`}
            />
            <span className="font-mono text-[10px] font-bold tracking-widest text-[#a8a49b]">
              ON AIR · DJ SET
            </span>
          </div>
          <p className="truncate text-[14px] font-bold text-[#f4f1ea]">{title}</p>
          <p className="truncate text-[11px] text-[#6e6b65]">
            {artist} · 상단 바에서 계속 재생돼요
          </p>
        </div>
        <Link
          href="/music/dj-set"
          className="shrink-0 border border-[#3d3d3d] px-3.5 py-2 text-[12px] font-medium text-[#f4f1ea] transition hover:border-[#FBC201] hover:text-[#FBC201]"
        >
          DJ SET 전체 →
        </Link>
      </div>
    </section>
  );
}

function NewReleasesSection({
  albums,
  onPlay,
}: {
  albums: MusicAlbumCard[];
  onPlay: (id: string) => void;
}) {
  return (
    <section id="new-releases">
      <SectionHead
        kicker="01  /  NEW RELEASES · 신규 발매"
        title="새로 들어온 음반"
        href="/music/albums"
        linkLabel="전체 보기 →"
      />
      {albums.length === 0 ? (
        <p className={`text-sm ${m.muted}`}>등록된 앨범이 없습니다.</p>
      ) : (
        <div className="grid grid-cols-2 gap-5 md:grid-cols-4 md:gap-6">
          {albums.map((album, index) => (
            <article key={album.id} className="group flex flex-col gap-3">
              <div className="relative aspect-square w-full overflow-hidden rounded-[6px] bg-[#151515]">
                {album.cover_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={album.cover_url}
                    alt={album.title}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-[#6e6b65]">—</div>
                )}
                <span className="absolute left-2.5 top-2.5 rounded-[3px] bg-[#FBC201] px-2 py-1 text-[10px] font-bold text-[#0a0a0a]">
                  {index === 0 ? "NEW · 이번 주" : "신규"}
                </span>
                <button
                  type="button"
                  aria-label={`${album.title} 재생`}
                  onClick={() => onPlay(album.id)}
                  className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#f4f1ea] text-[#0a0a0a] opacity-0 shadow transition group-hover:opacity-100 hover:bg-[#FBC201]"
                >
                  ▶
                </button>
              </div>
              <Link
                href={`/music/album/${album.id}`}
                className="line-clamp-2 text-[15px] font-bold leading-snug text-[#f4f1ea] hover:text-[#FBC201] md:text-[16px]"
              >
                {album.title}
              </Link>
              <Link
                href={album.artistId ? `/artists/${album.artistId}` : "/artists"}
                className="truncate text-[13px] text-[#a8a49b] hover:text-white"
              >
                {album.artist}
              </Link>
              <div className="flex items-center gap-2 font-mono text-[10px] tracking-wide text-[#6e6b65]">
                <span>DIGITAL</span>
                <span className="h-px flex-1 bg-[#262626]" />
                <span className="text-[13px] font-bold text-[#f4f1ea]">
                  {isPricedForSale(album.digital_price_krw)
                    ? formatKrwPrice(album.digital_price_krw)
                    : "STREAM"}
                </span>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function CollectionPlayer({
  album,
  playRequest,
}: {
  album: MusicAlbumCard | null;
  playRequest: number;
}) {
  const { addItem } = useCart();
  const { currentTrack, isPlaying, playQueue, play, pause, currentTime, duration } = usePlayer();

  const queue = album ? cardTracksToPlayerQueue(album) : [];
  const activeIndex = queue.findIndex((t) => t.id === currentTrack?.id);
  const isThisAlbum =
    Boolean(album) && currentTrack?.albumId === album?.id && activeIndex >= 0;

  useEffect(() => {
    if (playRequest <= 0 || !album) return;
    const q = cardTracksToPlayerQueue(album);
    if (q.length === 0) return;
    playQueue(q, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playRequest]);

  const startPlayback = (nextIndex = 0) => {
    if (queue.length === 0) return;
    if (isThisAlbum && currentTrack?.id === queue[nextIndex]?.id) {
      if (isPlaying) pause();
      else play();
      return;
    }
    playQueue(queue, nextIndex);
  };

  if (!album) {
    return (
      <div className="sticky top-24 rounded-[12px] border border-[rgba(244,241,234,0.12)] bg-[rgba(244,241,234,0.04)] p-5 text-sm text-[#6e6b65] backdrop-blur-[6px]">
        앨범을 선택하면 여기서 미리듣기 · 재생은 하단 바로 이어집니다.
      </div>
    );
  }

  const progress =
    isThisAlbum && duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;
  const nowPlaying = isThisAlbum ? queue[activeIndex] : queue[0];
  const priced = isPricedForSale(album.digital_price_krw);

  return (
    <div className="sticky top-24 flex flex-col gap-3 border-l-0 border-[#262626] pl-0 lg:border-l lg:pl-6">
      <div className="relative aspect-square w-full overflow-hidden bg-[#151515]">
        {album.cover_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={album.cover_url} alt={album.title} className="h-full w-full object-cover" />
        ) : null}
      </div>

      <div className="flex gap-2">
        <div className="relative h-[60px] w-[60px] overflow-hidden bg-[#0a0a0a]">
          {album.cover_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={album.cover_url} alt="" className="h-full w-full object-cover" />
          ) : null}
        </div>
        <div className="flex h-[60px] w-[60px] flex-col items-center justify-center border border-[#262626] bg-[#151515] font-mono text-[10px] font-bold text-[#6e6b65]">
          LP
        </div>
        <div className="flex h-[60px] w-[60px] flex-col items-center justify-center border border-[#262626] bg-[#151515] font-mono text-[10px] font-bold text-[#6e6b65]">
          TAPE
        </div>
        <div className="flex h-[60px] w-[60px] flex-col items-center justify-center border border-[#FBC201] bg-[#151515] font-mono text-[10px] font-bold text-[#FBC201]">
          DIGITAL
        </div>
      </div>

      <div className="flex items-center gap-3.5 pt-1.5">
        <button
          type="button"
          onClick={() => startPlayback(isThisAlbum ? Math.max(0, activeIndex) : 0)}
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#f4f1ea] text-[#0a0a0a] transition hover:bg-[#FBC201]"
          aria-label={isThisAlbum && isPlaying ? "일시정지" : "재생"}
          disabled={queue.length === 0}
        >
          {isThisAlbum && isPlaying ? "❚❚" : "▶"}
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-bold text-[#f4f1ea]">
            {nowPlaying?.title ?? album.title}
          </p>
          <p className="truncate text-[12px] text-[#a8a49b]">from 《{album.title}》</p>
          <p className="truncate text-[12px] text-[#a8a49b]">by {album.artist}</p>
        </div>
      </div>

      <div className="flex items-center gap-2.5 font-mono text-[11px] text-[#6e6b65]">
        <span>{formatClock(isThisAlbum ? currentTime : 0)}</span>
        <div className="relative h-[3px] flex-1 overflow-hidden rounded-full bg-[#262626]">
          <span
            className="absolute left-0 top-0 h-full bg-[#FBC201]"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span>
          {formatClock(
            isThisAlbum && duration > 0
              ? duration
              : nowPlaying?.duration ?? 0,
          )}
        </span>
      </div>

      <div className="flex flex-wrap gap-2 pt-1">
        <Link
          href={`/music/album/${album.id}`}
          className="rounded-[2px] bg-[#FBC201] px-4 py-2.5 text-[12px] font-bold text-[#0a0a0a] transition hover:opacity-90"
        >
          앨범 보기 · 구매
        </Link>
        <button
          type="button"
          disabled
          title="플레이리스트는 추후 제공"
          className="cursor-not-allowed border border-[#3d3d3d] px-4 py-2.5 text-[12px] font-medium text-[#6e6b65]"
        >
          + 플레이리스트
        </button>
        {priced && (
          <button
            type="button"
            className="border border-[#3d3d3d] px-4 py-2.5 text-[12px] font-medium text-[#f4f1ea] hover:border-[#a8a49b]"
            onClick={() =>
              addItem({
                productId: album.id,
                title: `${album.title} (Digital Album)`,
                imageUrl: album.cover_url,
                priceKrw: album.digital_price_krw as number,
                kind: "digital_album",
                albumId: album.id,
              })
            }
          >
            장바구니 {formatKrwPrice(album.digital_price_krw as number)}
          </button>
        )}
      </div>

      <p className="text-[11px] text-[#6e6b65]">
        커버·트랙을 누르면 하단 음악 바로 이어집니다 · {albumDateLabel(album.created_at)}
      </p>

      <div className="mt-1 max-h-[240px] overflow-y-auto border-t border-[#1c1c1c] pt-2">
        {queue.map((track, i) => {
          const active = isThisAlbum && currentTrack?.id === track.id;
          return (
            <button
              key={track.id}
              type="button"
              onClick={() => startPlayback(i)}
              className="flex w-full items-center justify-between gap-2 px-1 py-1.5 text-left hover:bg-[#121212]"
            >
              <span className="flex min-w-0 items-center gap-2">
                <span className={`font-mono text-[10px] ${active ? "text-[#FBC201]" : "text-[#6e6b65]"}`}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className={`truncate text-[12px] ${active ? "font-medium text-white" : "text-[#d4d0c8]"}`}>
                  {track.title}
                </span>
              </span>
              <span className="shrink-0 font-mono text-[10px] text-[#6e6b65]">
                {formatTrackDuration(track.duration)}
              </span>
            </button>
          );
        })}
        {queue.length === 0 && (
          <p className="py-2 text-xs text-[#6e6b65]">재생 가능한 트랙이 없습니다.</p>
        )}
      </div>
    </div>
  );
}

function ArtistsStrip({ artists }: { artists: DbArtist[] }) {
  return (
    <section id="artists">
      <SectionHead
        kicker="03  /  ARTISTS · 아티스트"
        title="아티스트"
        href="/artists"
        linkLabel="아티스트 전체 →"
      />
      {artists.length === 0 ? (
        <p className={`text-sm ${m.muted}`}>등록된 아티스트가 없습니다.</p>
      ) : (
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-5">
          {artists.slice(0, 5).map((artist) => (
            <Link
              key={artist.id}
              href={`/artists/${artist.id}`}
              className="group flex flex-col items-center gap-2.5 text-center"
            >
              <div className="relative h-[120px] w-[120px] overflow-hidden rounded-full border border-[#2e2e2e] bg-[#151515] transition group-hover:border-[#FBC201] sm:h-[140px] sm:w-[140px] md:h-[150px] md:w-[150px]">
                {artist.image_url ? (
                  <Image
                    src={artist.image_url}
                    alt={artist.name}
                    fill
                    className="object-cover"
                    sizes="150px"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-[11px] text-[#6e6b65]">
                    {artist.name.slice(0, 1)}
                  </div>
                )}
              </div>
              <span className="text-[14px] font-bold text-[#f4f1ea] group-hover:text-[#FBC201]">
                {artist.name}
              </span>
            </Link>
          ))}
        </div>
      )}
      <p className="mt-4 text-[11px] text-[#6e6b65]">
        ※ 아티스트 프로필 사진 수급 전까지 대표 이미지로 보여줘요.
      </p>
    </section>
  );
}

function MagazineMusicStrip({ posts }: { posts: MusicHomeMagazine[] }) {
  return (
    <section id="magazine-music">
      <SectionHead
        kicker="04  /  떠돌이말 · 음악"
        title="음악 이야기"
        href="/magazine/all?tag=%EC%9D%8C%EC%95%85"
        linkLabel="음악 글 더보기 →"
      />
      {posts.length === 0 ? (
        <p className={`text-sm ${m.muted}`}>
          show_on_music 으로 표시된 매거진이 아직 없습니다.
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.slice(0, 3).map((post) => (
            <Link
              key={post.id}
              href={magazinePublicPath(post)}
              className="flex flex-col overflow-hidden border border-[#3d3d3d] px-2 pb-3.5 pt-2 transition-colors hover:border-[#a8a49b]"
            >
              <div className="relative mb-3 aspect-[16/10] w-full overflow-hidden bg-[#151515]">
                {post.cover_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={post.cover_url} alt="" className="h-full w-full object-cover" />
                ) : null}
              </div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-[#6e6b65]">
                {post.category || "magazine"}
              </p>
              <h3 className="mt-1 text-[15px] font-bold text-[#f4f1ea]">{post.title}</h3>
              {post.excerpt ? (
                <p className="mt-2 line-clamp-2 text-[12px] text-[#a8a49b]">{post.excerpt}</p>
              ) : null}
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

function CdVinylStrip({ products }: { products: ProductWithImages[] }) {
  return (
    <section id="merch">
      <SectionHead
        kicker="05  /  MERCH · 음반 & 머천"
        title="음반 & 머천"
        href="/sale?category=cd"
        linkLabel="스토어 더보기 →"
      />
      {products.length === 0 ? (
        <p className={`text-sm ${m.muted}`}>등록된 CD/Vinyl 상품이 없습니다.</p>
      ) : (
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => {
            const image = getProductImages(product)[0];
            return (
              <Link
                key={product.id}
                href={`/sale/${product.id}`}
                className="group flex flex-col gap-2"
              >
                <div className="relative aspect-square w-full overflow-hidden rounded-[6px] bg-[#151515]">
                  {image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={image}
                      alt={product.title}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  ) : null}
                </div>
                <h4 className="line-clamp-2 text-[14px] font-bold text-[#f4f1ea] group-hover:text-[#FBC201]">
                  {product.title}
                </h4>
                <span className="font-mono text-[13px] font-bold text-[#f4f1ea]">
                  {formatKrwPrice(product.price_krw)}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
