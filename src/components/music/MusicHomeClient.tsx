"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import { useDjSet } from "@/context/DjSetContext";
import { usePlayer } from "@/context/PlayerContext";
import { formatTrackDuration, isPricedForSale } from "@/lib/albums";
import {
  albumDateLabel,
  formatKrwPrice,
  type MusicAlbumCard,
} from "@/lib/musicCatalog";
import { notifyMusicTakeover, onCollectionPause, onDjTakeover } from "@/lib/playbackFocus";
import type { ProductWithImages } from "@/lib/products";
import { getProductImages } from "@/lib/products";
import type { DbArtist } from "@/lib/artists";

type MusicHomeClientProps = {
  newReleases: MusicAlbumCard[];
  collection: MusicAlbumCard[];
  artists: DbArtist[];
  merch: ProductWithImages[];
};

export function MusicHomeClient({
  newReleases,
  collection,
  artists,
  merch,
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
  const selected = albumsById.get(selectedId) ?? collection[0] ?? newReleases[0] ?? null;

  const selectAlbum = (id: string, play = false) => {
    setSelectedId(id);
    if (play) setPlayRequest((n) => n + 1);
  };

  const filteredCollection = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return collection;
    return collection.filter(
      (album) =>
        album.title.toLowerCase().includes(q) ||
        album.artist.toLowerCase().includes(q) ||
        album.tracks.some((track) => track.title.toLowerCase().includes(q)),
    );
  }, [collection, query]);

  const ticker = newReleases.length > 0 ? [...newReleases, ...newReleases] : [];

  return (
    <div className="bg-black text-[#f5f5f5]">
      <NewReleasesTicker
        albums={ticker}
        onSelect={(id) => {
          selectAlbum(id);
          document.getElementById("collection")?.scrollIntoView({ behavior: "smooth" });
        }}
        onPlay={(id) => {
          selectAlbum(id, true);
          document.getElementById("collection")?.scrollIntoView({ behavior: "smooth" });
        }}
      />
      <CollectionSection
        albums={filteredCollection}
        selected={selected}
        query={query}
        onQuery={setQuery}
        onSelect={(id) => selectAlbum(id)}
        playRequest={playRequest}
      />
      <ArtistsStrip artists={artists} />
      <CdVinylStrip products={merch} />
    </div>
  );
}

function NewReleasesTicker({
  albums,
  onSelect,
  onPlay,
}: {
  albums: MusicAlbumCard[];
  onSelect: (id: string) => void;
  onPlay: (id: string) => void;
}) {
  if (albums.length === 0) {
    return (
      <section className="border-b border-[#1c1c1c] px-4 py-12 md:px-8">
        <h1 className="text-[22px] font-bold uppercase tracking-tight md:text-[28px]">NEW RELEASES</h1>
        <p className="mt-4 text-sm text-neutral-500">등록된 앨범이 없습니다.</p>
      </section>
    );
  }

  return (
    <section className="overflow-hidden border-b border-[#1c1c1c] py-8 md:py-12" id="new-releases">
      <div className="mb-6 flex flex-col justify-between gap-3 border-b border-[#1c1c1c] px-4 pb-3 sm:flex-row sm:items-baseline md:px-8">
        <div className="flex flex-wrap items-baseline gap-3">
          <h1 className="text-[22px] font-bold uppercase tracking-tight md:text-[28px]">NEW RELEASES</h1>
          <span className="font-mono text-[11px] uppercase tracking-widest text-neutral-500">
            신규 발매 앨범
          </span>
        </div>
      </div>
      <div className="bandcamp-ticker-wrap relative w-full overflow-hidden">
        <div className="bandcamp-ticker-track gap-5 px-4 md:px-8">
          {albums.map((album, index) => (
            <article
              key={`${album.id}-${index}`}
              className="group w-56 shrink-0 select-none sm:w-60 md:w-64"
            >
              <div className="relative aspect-square w-full overflow-hidden border border-[#1a1a1a] bg-[#0a0a0a]">
                {album.cover_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={album.cover_url}
                    alt={album.title}
                    className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105 group-hover:opacity-90"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-neutral-600">—</div>
                )}
                <button
                  type="button"
                  aria-label="앨범 재생"
                  onClick={() => onPlay(album.id)}
                  className="absolute bottom-3 right-3 z-10 flex h-10 w-10 translate-y-1 items-center justify-center rounded-full bg-white text-black opacity-0 shadow-2xl transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100 hover:bg-[#FF3322] hover:text-white"
                >
                  ▶
                </button>
              </div>
              <div className="mt-2.5 flex flex-col">
                <div className="mb-1 flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-neutral-500">
                  <span>{albumDateLabel(album.created_at)}</span>
                </div>
                <button
                  type="button"
                  onClick={() => onSelect(album.id)}
                  className="mb-1 truncate text-left text-[14px] font-bold leading-tight text-white hover:text-[#FF3322]"
                >
                  {album.title}
                </button>
                <Link
                  href={album.artistId ? `/artists/${album.artistId}` : "#"}
                  className="mb-2 truncate text-[13px] text-neutral-400 hover:text-white"
                >
                  {album.artist}
                </Link>
                <div className="flex items-center justify-between border-t border-[#1a1a1a] pt-1.5 font-mono text-[11px]">
                  <span className="text-neutral-400">DIGITAL</span>
                  <span className="font-bold text-white">
                    {isPricedForSale(album.digital_price_krw)
                      ? formatKrwPrice(album.digital_price_krw)
                      : "STREAM"}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function CollectionSection({
  albums,
  selected,
  query,
  onQuery,
  onSelect,
  playRequest,
}: {
  albums: MusicAlbumCard[];
  selected: MusicAlbumCard | null;
  query: string;
  onQuery: (value: string) => void;
  onSelect: (id: string) => void;
  playRequest: number;
}) {
  return (
    <section className="border-b border-[#1c1c1c] px-4 py-10 md:px-8 md:py-14" id="collection">
      <div className="mb-8 flex flex-col justify-between gap-4 border-b border-[#1c1c1c] pb-4 lg:flex-row lg:items-end">
        <div>
          <h2 className="text-[22px] font-bold uppercase tracking-tight md:text-[28px]">COLLECTION</h2>
          <div className="relative mt-2.5 flex w-full max-w-md items-center border border-[#262626] bg-[#0c0c0c] px-2.5 py-1.5 focus-within:border-white">
            <input
              type="search"
              value={query}
              onChange={(e) => onQuery(e.target.value)}
              placeholder="아티스트, 앨범, 트랙 검색..."
              className="w-full border-0 bg-transparent p-0 font-mono text-xs text-neutral-200 outline-none placeholder:text-neutral-500"
            />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
        <div className="lg:col-span-7">
          {albums.length === 0 ? (
            <p className="text-sm text-neutral-500">표시할 앨범이 없습니다.</p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {albums.map((album) => {
                const active = selected?.id === album.id;
                return (
                  <button
                    key={album.id}
                    type="button"
                    onClick={() => onSelect(album.id)}
                    className={`group flex flex-col bg-[#080808] p-2.5 text-left transition-all ${
                      active ? "border border-white" : "border border-[#1a1a1a] hover:border-neutral-500"
                    }`}
                  >
                    <div className="relative mb-2 aspect-square w-full overflow-hidden bg-black">
                      {album.cover_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={album.cover_url}
                          alt={album.title}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-neutral-600">—</div>
                      )}
                    </div>
                    <h4 className="truncate text-[13px] font-bold leading-tight text-white group-hover:text-[#FF3322]">
                      {album.title}
                    </h4>
                    <span className="truncate text-[12px] text-neutral-400">{album.artist}</span>
                    <div className="mt-1.5 flex items-center justify-between border-t border-[#1a1a1a] pt-1.5 font-mono text-[11px]">
                      <span className="text-[10px] text-neutral-500">DIGITAL</span>
                      <span className="font-bold text-white">
                        {isPricedForSale(album.digital_price_krw)
                          ? formatKrwPrice(album.digital_price_krw)
                          : "STREAM"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <div className="lg:col-span-5">
          <CollectionPlayer album={selected} playRequest={playRequest} />
        </div>
      </div>
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
  const { close } = usePlayer();
  const { pause: pauseDj } = useDjSet();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const tracks = album?.tracks.filter((t) => t.audio_url) ?? [];
  const current = tracks[index] ?? null;

  const stopLocal = useCallback(() => {
    setPlaying(false);
    audioRef.current?.pause();
  }, []);

  useEffect(() => {
    const offDj = onDjTakeover(stopLocal);
    const offCol = onCollectionPause(stopLocal);
    return () => {
      offDj();
      offCol();
    };
  }, [stopLocal]);

  useEffect(() => {
    setIndex(0);
    setPlaying(false);
    setCurrentTime(0);
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
    }
  }, [album?.id]);

  useEffect(() => {
    if (playRequest <= 0) return;
    const playable = album?.tracks.filter((t) => t.audio_url) ?? [];
    if (playable.length === 0) return;
    close();
    pauseDj();
    notifyMusicTakeover();
    setIndex(0);
    setPlaying(true);
    // album은 playRequest와 같은 렌더에서 갱신됨
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playRequest]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !current) return;
    if (audio.src !== current.audio_url) {
      audio.src = current.audio_url;
      audio.load();
    }
    if (playing) void audio.play().catch(() => setPlaying(false));
    else audio.pause();
  }, [current, playing]);

  const startPlayback = (nextIndex = index) => {
    if (tracks.length === 0) return;
    close();
    pauseDj();
    notifyMusicTakeover();
    setIndex(nextIndex);
    setPlaying(true);
  };

  if (!album) {
    return (
      <div className="sticky top-20 border border-[#222] bg-[#080808] p-5 text-sm text-neutral-500">
        앨범을 선택하면 여기에서 재생됩니다.
      </div>
    );
  }

  const progress = duration > 0 ? Math.min(1, currentTime / duration) : 0;

  return (
    <div className="sticky top-20 flex flex-col gap-4 border border-[#222] bg-[#080808] p-5">
      <audio
        ref={audioRef}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime || 0)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
        onEnded={() => {
          if (index + 1 < tracks.length) startPlayback(index + 1);
          else setPlaying(false);
        }}
      />
      <div className="flex flex-col gap-5 sm:flex-row">
        <div className="relative aspect-square w-36 shrink-0 overflow-hidden border border-[#262626] bg-black sm:w-44">
          {album.cover_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={album.cover_url} alt={album.title} className="h-full w-full object-cover" />
          ) : null}
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-between">
          <div>
            <div className="mb-1 font-mono text-[10px] uppercase text-neutral-500">
              {albumDateLabel(album.created_at)}
            </div>
            <Link
              href={`/music/album/${album.id}`}
              className="mb-1 block text-[18px] font-bold leading-tight text-white hover:text-[#FF3322] md:text-[20px]"
            >
              {album.title}
            </Link>
            <Link
              href={album.artistId ? `/artists/${album.artistId}` : "#"}
              className="mb-2 block text-[13px] text-neutral-400 hover:text-white"
            >
              {album.artist}
            </Link>
          </div>
          {isPricedForSale(album.digital_price_krw) && (
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-[11px] text-neutral-500">BUY PRICE:</span>
              <span className="font-mono text-[18px] font-bold text-white">
                {formatKrwPrice(album.digital_price_krw)}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2.5 border border-[#1a1a1a] bg-[#0c0c0c] p-3">
        <div className="flex items-center justify-between font-mono text-[11px] text-neutral-400">
          <span className="flex items-center gap-1.5 font-bold text-white">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#FF3322]" />
            {playing ? "PLAYING" : "PREVIEW"}
          </span>
          <span>{current ? current.title : "트랙 없음"}</span>
        </div>
        <button
          type="button"
          className="relative h-1.5 w-full overflow-hidden rounded-full bg-[#222]"
          onClick={(e) => {
            const audio = audioRef.current;
            if (!audio || !duration) return;
            const rect = e.currentTarget.getBoundingClientRect();
            audio.currentTime = ((e.clientX - rect.left) / rect.width) * duration;
          }}
        >
          <span className="absolute left-0 top-0 h-full bg-[#FF3322]" style={{ width: `${progress * 100}%` }} />
        </button>
        <div className="flex items-center justify-center gap-4 text-neutral-400">
          <button type="button" onClick={() => startPlayback(Math.max(0, index - 1))} aria-label="이전">
            ⏮
          </button>
          <button
            type="button"
            onClick={() => (playing ? setPlaying(false) : startPlayback(index))}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-black hover:bg-[#FF3322] hover:text-white"
            aria-label={playing ? "일시정지" : "재생"}
          >
            {playing ? "❚❚" : "▶"}
          </button>
          <button
            type="button"
            onClick={() => startPlayback(Math.min(tracks.length - 1, index + 1))}
            aria-label="다음"
          >
            ⏭
          </button>
        </div>
        <div className="flex justify-between font-mono text-[10px] text-neutral-500">
          <span>{formatTrackDuration(currentTime)}</span>
          <span>{formatTrackDuration(duration || current?.duration)}</span>
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between border-b border-[#1c1c1c] pb-1.5 font-mono text-[11px] uppercase tracking-wider text-neutral-400">
          <span className="font-medium text-white">Tracklist</span>
          <span className="text-[10px] text-neutral-500">FREE STREAM</span>
        </div>
        <div className="flex flex-col divide-y divide-[#141414] text-[12px]">
          {tracks.map((track, i) => (
            <div key={track.id} className="flex items-center justify-between px-1 py-1.5 hover:bg-[#121212]">
              <button type="button" className="flex min-w-0 items-center gap-2 text-left" onClick={() => startPlayback(i)}>
                <span className={`font-mono text-[10px] ${i === index ? "text-[#FF3322]" : "text-neutral-500"}`}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className={i === index ? "font-medium text-white" : "text-neutral-300"}>{track.title}</span>
              </button>
              <div className="flex shrink-0 items-center gap-2 font-mono text-[10px] text-neutral-500">
                <span>{formatTrackDuration(track.duration)}</span>
                {isPricedForSale(track.digital_price_krw) && (
                  <button
                    type="button"
                    className="uppercase tracking-wider text-white hover:text-[#FF3322]"
                    onClick={() =>
                      addItem({
                        productId: track.id,
                        title: `${album.title} — ${track.title}`,
                        imageUrl: album.cover_url,
                        priceKrw: track.digital_price_krw as number,
                        kind: "digital_track",
                        albumId: album.id,
                        trackId: track.id,
                      })
                    }
                  >
                    {formatKrwPrice(track.digital_price_krw)}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {isPricedForSale(album.digital_price_krw) && (
        <div className="flex flex-col gap-2 border-t border-[#1c1c1c] pt-2 sm:flex-row">
          <button
            type="button"
            className="flex-1 bg-white py-2.5 text-center font-mono text-[11px] font-bold uppercase tracking-wider text-black hover:bg-[#FF3322] hover:text-white"
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
            장바구니 담기
          </button>
          <Link
            href="/checkout"
            className="border border-[#262626] bg-[#141414] px-4 py-2.5 text-center font-mono text-[11px] uppercase tracking-wider text-neutral-200 hover:bg-neutral-800"
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
            BUY DIGITAL
          </Link>
        </div>
      )}
    </div>
  );
}

function ArtistsStrip({ artists }: { artists: DbArtist[] }) {
  return (
    <section className="border-b border-[#1c1c1c] px-4 py-10 md:px-8 md:py-14" id="artists">
      <div className="mb-8 flex flex-col justify-between gap-2 border-b border-[#1c1c1c] pb-3 sm:flex-row sm:items-baseline">
        <h2 className="text-[22px] font-bold uppercase tracking-tight md:text-[28px]">ARTISTS</h2>
        <Link
          href="/artists"
          className="font-mono text-[11px] uppercase tracking-wider text-neutral-400 hover:text-white"
        >
          More →
        </Link>
      </div>
      {artists.length === 0 ? (
        <p className="text-sm text-neutral-500">등록된 아티스트가 없습니다.</p>
      ) : (
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 md:grid-cols-5">
          {artists.map((artist) => (
            <Link key={artist.id} href={`/artists/${artist.id}`} className="group flex flex-col items-center text-center">
              <div className="relative mb-3 h-28 w-28 overflow-hidden border border-[#2e2e2e] bg-[#0c0c0c] shadow-lg transition-all duration-300 group-hover:scale-105 group-hover:border-white sm:h-32 sm:w-32 md:h-36 md:w-36">
                {artist.image_url ? (
                  <Image src={artist.image_url} alt={artist.name} fill className="object-cover" sizes="144px" />
                ) : (
                  <div className="flex h-full items-center justify-center text-neutral-600">{artist.name.slice(0, 1)}</div>
                )}
              </div>
              <span className="text-[14px] font-bold text-white group-hover:text-[#FF3322]">{artist.name}</span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

function CdVinylStrip({ products }: { products: ProductWithImages[] }) {
  return (
    <section className="bg-black px-4 py-10 md:px-8 md:py-14" id="merch">
      <div className="mb-8 flex items-baseline justify-between border-b border-[#1c1c1c] pb-3">
        <h2 className="text-2xl font-black uppercase tracking-tight text-white sm:text-3xl">CD &amp; VINYL</h2>
        <Link
          href="/sale?category=cd"
          className="font-mono text-[11px] uppercase tracking-wider text-neutral-400 hover:text-white"
        >
          More →
        </Link>
      </div>
      {products.length === 0 ? (
        <p className="text-sm text-neutral-500">등록된 CD/Vinyl 상품이 없습니다.</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => {
            const image = getProductImages(product)[0];
            return (
              <Link
                key={product.id}
                href={`/sale/${product.id}`}
                className="group flex flex-col justify-between border border-[#1a1a1a] bg-[#080808] p-4"
              >
                <div className="relative mb-3 aspect-square w-full overflow-hidden bg-black">
                  {image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={image} alt={product.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : null}
                </div>
                <h4 className="mb-1 line-clamp-1 text-[14px] font-bold text-white group-hover:text-[#FF3322]">
                  {product.title}
                </h4>
                <div className="mt-2 flex items-center justify-between border-t border-[#141414] pt-2">
                  <span className="font-mono text-[13px] font-bold text-white">
                    {formatKrwPrice(product.price_krw)}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
