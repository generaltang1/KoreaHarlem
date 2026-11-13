"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePlayer, type Track } from "@/context/PlayerContext";
import type { DbAlbumTrack } from "@/lib/albums";
import { formatTrackDuration } from "@/lib/albums";
import { albumTypeLabel } from "@/lib/albumPublish";
import { dbTracksToPlayerQueue } from "@/lib/musicPlay";

/* ───────────── types ───────────── */

export type ArtistAlbumWithTracks = {
  id: string;
  title: string;
  cover_url: string | null;
  created_at: string;
  album_type?: string | null;
  release_date?: string | null;
  album_tracks: DbAlbumTrack[];
};

export type ArtistPublic = {
  id: string;
  name: string;
  name_en?: string | null;
  bio?: string | null;
  image_url?: string | null;
  genre?: string | null;
  agency?: string | null;
  activity_type?: string | null;
  debut_date?: string | null;
  instagram_url?: string | null;
  youtube_url?: string | null;
  website_url?: string | null;
};

export type ArtistMagazineCard = {
  id: string;
  title: string;
  cover_url: string | null;
  published_at: string | null;
  category: string | null;
  slug?: string | null;
};

export type ArtistMerchCard = {
  id: string;
  title: string;
  price_krw: number;
  image: string | null;
  soldOut: boolean;
};

/* ───────────── Figma E-03 (136:446) tokens ───────────── */

const mono = "font-mono";
const display = "[font-family:var(--font-f-display),var(--font-f-sans),sans-serif]";
const kicker = `${mono} text-[11px] font-medium uppercase leading-normal tracking-[1.4px] text-[#fbc201]`;
const sectionTitle = "text-[22px] font-bold leading-normal tracking-[-0.4px] text-[#f4f1ea]";
const placeholderBox =
  "flex items-center justify-center border border-[#262626] bg-[#151515] p-2 text-center text-[11px] font-medium text-[#6e6b65]";

type TabKey = "all" | "album" | "ep" | "mix";
const TABS: { key: TabKey; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "album", label: "정규" },
  { key: "ep", label: "싱글·EP" },
  { key: "mix", label: "믹스테이프" },
];

function matchesTab(type: string | null | undefined, tab: TabKey) {
  if (tab === "all") return true;
  if (tab === "album") return type === "album";
  if (tab === "ep") return type === "single" || type === "ep";
  return type === "mix";
}

function youtubeVideoId(url?: string | null): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtu.be") return u.pathname.slice(1).split("/")[0] || null;
    if (host.endsWith("youtube.com") || host.endsWith("youtube-nocookie.com")) {
      const v = u.searchParams.get("v");
      if (v) return v;
      const m = u.pathname.match(/^\/(?:embed|shorts|live)\/([\w-]{6,})/);
      if (m) return m[1];
    }
  } catch {
    /* ignore invalid url */
  }
  return null;
}

function instagramHandle(url?: string | null): string | null {
  if (!url) return null;
  try {
    const seg = new URL(url).pathname.split("/").filter(Boolean)[0];
    return seg ? `@${seg}` : null;
  } catch {
    return null;
  }
}

function splitTags(genre?: string | null): string[] {
  return (genre ?? "")
    .split(/[,/·]/)
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 4);
}

function PlayIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="currentColor" aria-hidden>
      <path d="M2.5 1.2v9.6a.5.5 0 0 0 .77.42l7.4-4.8a.5.5 0 0 0 0-.84l-7.4-4.8a.5.5 0 0 0-.77.42Z" />
    </svg>
  );
}

function PauseIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="currentColor" aria-hidden>
      <rect x="2" y="1.5" width="3" height="9" />
      <rect x="7" y="1.5" width="3" height="9" />
    </svg>
  );
}

function SectionHead({
  kickerNode,
  title,
  meta,
  href,
}: {
  kickerNode: React.ReactNode;
  title: string;
  meta?: React.ReactNode;
  href?: string;
}) {
  return (
    <div className="flex items-end gap-4 pb-1">
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        {kickerNode}
        <h2 className={sectionTitle}>{title}</h2>
      </div>
      {href ? (
        <Link href={href} className="shrink-0 text-[12px] font-medium text-[#a8a49b] hover:text-[#f4f1ea]">
          {meta}
        </Link>
      ) : meta ? (
        <p className="shrink-0 text-[12px] font-medium text-[#a8a49b]">{meta}</p>
      ) : null}
    </div>
  );
}

/* ───────────── component ───────────── */

export function ArtistDetailClient({
  artist,
  albums,
  magazine = [],
  merch = [],
}: {
  artist: ArtistPublic;
  albums: ArtistAlbumWithTracks[];
  magazine?: ArtistMagazineCard[];
  merch?: ArtistMerchCard[];
}) {
  const { playQueue, currentTrack, isPlaying, play, pause } = usePlayer();
  const [selectedId, setSelectedId] = useState(albums[0]?.id ?? "");
  const [tab, setTab] = useState<TabKey>("all");
  const [following, setFollowing] = useState(false);

  const followKey = `kh:artist-follow:${artist.id}`;
  useEffect(() => {
    try {
      setFollowing(window.localStorage.getItem(followKey) === "1");
    } catch {
      /* ignore */
    }
  }, [followKey]);

  const toggleFollow = () => {
    setFollowing((prev) => {
      const next = !prev;
      try {
        if (next) window.localStorage.setItem(followKey, "1");
        else window.localStorage.removeItem(followKey);
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const selected = albums.find((a) => a.id === selectedId) ?? albums[0] ?? null;

  const albumQueue = (album: ArtistAlbumWithTracks): Track[] =>
    dbTracksToPlayerQueue(album.album_tracks, {
      id: album.id,
      title: album.title,
      artist: artist.name,
      cover_url: album.cover_url,
    });

  const queue = useMemo(
    () => (selected ? albumQueue(selected) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selected, artist.name],
  );

  /** 하단 MusicPlayer(PlayerContext.playQueue)로만 재생 */
  const playFrom = (q: Track[], index: number) => {
    if (q.length === 0) return;
    if (currentTrack?.id === q[index]?.id) {
      if (isPlaying) pause();
      else play();
      return;
    }
    playQueue(q, index);
  };

  const playAlbum = (album: ArtistAlbumWithTracks) => {
    const q = albumQueue(album);
    if (q.length === 0) return;
    const isThis = q.some((t) => t.id === currentTrack?.id);
    if (isThis) {
      if (isPlaying) pause();
      else play();
      return;
    }
    playQueue(q, 0);
  };

  const sortedAlbums = useMemo(
    () => [...albums].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [albums],
  );

  /** 최근 발매 음원 (사이드바) — 최신 앨범 순 트랙 4개 */
  const latest = useMemo(() => {
    const out: { track: Track; no: number; albumTitle: string; q: Track[]; index: number }[] = [];
    for (const album of sortedAlbums) {
      const q = dbTracksToPlayerQueue(album.album_tracks, {
        id: album.id,
        title: album.title,
        artist: artist.name,
        cover_url: album.cover_url,
      });
      q.forEach((track, index) => {
        out.push({ track, no: index + 1, albumTitle: album.title, q, index });
      });
      if (out.length >= 4) break;
    }
    return out.slice(0, 4);
  }, [sortedAlbums, artist.name]);

  const playlists = useMemo(() => albums.filter((a) => a.album_type === "playlist"), [albums]);
  const visibleAlbums = useMemo(
    () => sortedAlbums.filter((a) => matchesTab(a.album_type, tab)),
    [sortedAlbums, tab],
  );

  const tags = splitTags(artist.genre);
  const videoId = youtubeVideoId(artist.youtube_url);
  const igHandle = instagramHandle(artist.instagram_url);

  const facts: { label: string; value: string }[] = [
    { label: "레이블", value: artist.agency?.trim() || "koreaharlem" },
    ...(artist.activity_type?.trim()
      ? [{ label: "활동 형태", value: artist.activity_type.trim() }]
      : []),
    ...(artist.debut_date ? [{ label: "데뷔", value: artist.debut_date }] : []),
    { label: "발매 음반", value: `${albums.length}장 (코리아할렘 셀렉츠 기준)` },
  ];

  const links: { label: string; href: string }[] = [
    ...(artist.instagram_url ? [{ label: "Instagram ↗", href: artist.instagram_url }] : []),
    ...(artist.youtube_url ? [{ label: "YouTube ↗", href: artist.youtube_url }] : []),
    ...(artist.website_url ? [{ label: "공식 사이트 ↗", href: artist.website_url }] : []),
  ];

  return (
    <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-14 px-4 pb-28 pt-8 sm:px-8 lg:px-14">
      {/* breadcrumb */}
      <p className={`${mono} flex flex-wrap gap-x-2 text-[11px] font-medium tracking-[0.8px] text-[#6e6b65]`}>
        <Link href="/music" className="hover:text-[#f4f1ea]">
          MUSIC
        </Link>
        <span>/</span>
        <span>코리아할렘 셀렉츠</span>
        <span>/</span>
        <Link href="/artists" className="hover:text-[#f4f1ea]">
          ARTISTS
        </Link>
        <span>/</span>
        <span>{artist.name}</span>
      </p>

      {/* Hero */}
      <section className="flex flex-col gap-8 lg:flex-row lg:gap-12">
        <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
          <div className="relative mx-auto aspect-[4/5] w-full max-w-[400px] overflow-hidden rounded-[6px] border border-[#262626] bg-[#151515] sm:mx-0 sm:h-[500px] sm:w-[400px] sm:max-w-none sm:aspect-auto">
            {artist.image_url ? (
              <Image src={artist.image_url} alt={artist.name} fill priority className="object-cover" sizes="400px" />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-0.5 p-2 text-center text-[11px] font-medium text-[#6e6b65]">
                <span>아티스트 사진 1</span>
                <span>(대표 · 세로 4:5)</span>
              </div>
            )}
          </div>
          <div className="hidden flex-col gap-3 sm:flex">
            <div className={`${placeholderBox} h-[244px] w-[190px] rounded-[6px]`}>사진 2</div>
            <div className={`${placeholderBox} h-[244px] w-[190px] rounded-[6px]`}>사진 3</div>
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <p className={`${mono} text-[11px] font-medium uppercase tracking-[1.4px] text-[#fbc201] whitespace-pre`}>
            {"ARTIST  ·  KOREAHARLEM SELECTS"}
          </p>
          <h1 className="text-[44px] font-bold leading-[1.1] tracking-[-2px] text-[#f4f1ea] md:text-[60px]">
            {artist.name}
          </h1>
          {artist.name_en ? (
            <p className={`text-[18px] font-medium text-[#a8a49b] ${display}`}>{artist.name_en}</p>
          ) : null}
          {tags.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="border border-[#3d3d3d] px-[7px] py-[3px] text-[10px] font-medium uppercase text-[#f4f1ea]"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
          {artist.bio ? (
            <p className="max-w-2xl whitespace-pre-wrap text-[15px] leading-6 text-[#d4d0c8]">{artist.bio}</p>
          ) : (
            <p className="text-[15px] leading-6 text-[#6e6b65]">등록된 소개가 없습니다.</p>
          )}

          <dl className="flex flex-col gap-2 pt-1 text-[12px]">
            {facts.map((row) => (
              <div key={row.label} className="flex gap-3">
                <dt className="w-20 shrink-0 text-[#6e6b65]">{row.label}</dt>
                <dd className="min-w-0 flex-1 font-medium text-[#a8a49b]">{row.value}</dd>
              </div>
            ))}
          </dl>

          {links.length > 0 ? (
            <div className="flex flex-wrap gap-2 pt-1.5">
              {links.map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  target="_blank"
                  rel="noreferrer"
                  className={`border border-[#3d3d3d] px-[14px] py-2 text-[12px] font-medium text-[#f4f1ea] transition-colors hover:border-[#a8a49b] ${display}`}
                >
                  {l.label}
                </a>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      {/* Columns */}
      <div className="flex flex-col gap-10 lg:flex-row">
        {/* Main */}
        <div className="flex min-w-0 flex-1 flex-col gap-14">
          {/* Discography */}
          <section className="flex flex-col gap-[18px]">
            <SectionHead
              kickerNode={<p className={kicker}>DISCOGRAPHY · 발매 음반</p>}
              title="발매 음반"
              meta={`전체 ${albums.length}`}
            />
            <div className="flex flex-wrap gap-[18px] text-[13px]">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTab(t.key)}
                  className={`transition-colors ${
                    tab === t.key ? "font-bold text-[#f4f1ea]" : "font-medium text-[#6e6b65] hover:text-[#a8a49b]"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {albums.length === 0 ? (
              <p className="text-sm text-[#6e6b65]">등록된 앨범이 없습니다.</p>
            ) : null}

            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3">
              {visibleAlbums.map((album) => {
                const q = albumQueue(album);
                const isThis = q.some((t) => t.id === currentTrack?.id);
                const playing = isThis && isPlaying;
                const active = selectedId === album.id;
                return (
                  <div key={album.id} className="group flex min-w-0 flex-col gap-2">
                    <div
                      className={`relative aspect-square overflow-hidden rounded-[4px] bg-[#151515] ${
                        active ? "ring-2 ring-[#fbc201]" : ""
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedId(album.id)}
                        className="absolute inset-0 block"
                        aria-label={`${album.title} 트랙 보기`}
                      >
                        {album.cover_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={album.cover_url}
                            alt=""
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                          />
                        ) : (
                          <span className="flex h-full items-center justify-center text-[#6e6b65]">KH</span>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => playAlbum(album)}
                        disabled={q.length === 0}
                        aria-label={`${album.title} ${playing ? "일시정지" : "재생"}`}
                        className="absolute bottom-3 left-3 flex size-10 items-center justify-center rounded-full bg-[#f4f1ea] text-[#0a0a0a] shadow-[0_2px_10px_rgba(0,0,0,0.45)] transition hover:bg-[#fbc201] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {playing ? <PauseIcon /> : <PlayIcon />}
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedId(album.id)}
                      className={`text-left text-[14px] font-bold leading-snug transition-colors ${
                        active ? "text-[#fbc201]" : "text-[#f4f1ea] group-hover:text-[#fbc201]"
                      }`}
                    >
                      {album.title}
                    </button>
                    <p className={`${mono} text-[10px] font-medium uppercase text-[#6e6b65]`}>
                      {albumTypeLabel(album.album_type)} · {album.album_tracks.length} TRACKS
                    </p>
                    <Link
                      href={`/music/album/${album.id}`}
                      className="text-[10px] uppercase tracking-widest text-[#6e6b65] hover:text-[#f4f1ea]"
                    >
                      상세 →
                    </Link>
                  </div>
                );
              })}
              <div className={`${placeholderBox} aspect-square rounded-[4px] flex-col gap-0.5`}>
                <span>발매 예정 음반</span>
                <span>(예약 업로드 시 표시)</span>
              </div>
            </div>

            {/* 선택 앨범 트랙리스트 — 하단 MusicPlayer 로 재생 */}
            <div className="mt-2 flex flex-col gap-3 rounded-[14px] border border-[#262626] bg-[#151515] p-5">
              <p className={`${mono} text-[11px] font-medium uppercase tracking-[1.2px] text-[#fbc201]`}>
                TRACKS · 선택 앨범
              </p>
              <h3 className="truncate text-[16px] font-bold text-[#f4f1ea]">
                {selected?.title ?? "앨범을 선택하세요"}
              </h3>
              <div className="flex max-h-[360px] flex-col overflow-y-auto">
                {queue.length === 0 ? (
                  <p className="text-xs text-[#6e6b65]">재생 가능한 트랙이 없습니다.</p>
                ) : (
                  queue.map((track, i) => {
                    const active = currentTrack?.id === track.id;
                    return (
                      <button
                        key={track.id}
                        type="button"
                        onClick={() => playFrom(queue, i)}
                        className="flex items-center gap-3 border-b border-[#262626] py-1.5 text-left last:border-b-0"
                      >
                        <span
                          className={`flex size-6 shrink-0 items-center justify-center rounded-full ${
                            active ? "bg-[#fbc201] text-[#0a0a0a]" : "border border-[#3d3d3d] text-[#f4f1ea]"
                          }`}
                        >
                          {active && isPlaying ? <PauseIcon size={9} /> : <PlayIcon size={9} />}
                        </span>
                        <span className={`${mono} w-6 text-[10px] text-[#6e6b65]`}>
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span
                          className={`min-w-0 flex-1 truncate text-[13px] font-bold ${
                            active ? "text-[#fbc201]" : "text-[#f4f1ea]"
                          }`}
                        >
                          {track.title}
                        </span>
                        <span className={`${mono} text-[11px] text-[#6e6b65]`}>
                          {formatTrackDuration(track.duration)}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
              <p className="text-[11px] text-[#6e6b65]">재생은 하단 음악 바로 이어집니다.</p>
            </div>
          </section>

          {/* Video */}
          <section className="flex flex-col gap-4">
            <SectionHead kickerNode={<p className={kicker}>VIDEO · 유튜브 임베드</p>} title="영상" />
            <div className="relative flex min-h-[240px] w-full flex-col items-center justify-center gap-2.5 overflow-hidden rounded-[10px] border border-[#262626] bg-[#0a0a0a] sm:aspect-video">
              {videoId ? (
                <iframe
                  className="absolute inset-0 h-full w-full"
                  src={`https://www.youtube-nocookie.com/embed/${videoId}`}
                  title={`${artist.name} 영상`}
                  allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  loading="lazy"
                />
              ) : (
                <>
                  <span className="flex size-16 items-center justify-center rounded-full bg-[#f4f1ea] text-[#0a0a0a]">
                    <PlayIcon size={17} />
                  </span>
                  <p className="px-4 text-center text-[12px] text-[#f4f1ea]">
                    {artist.youtube_url ? (
                      <a href={artist.youtube_url} target="_blank" rel="noreferrer" className="underline">
                        YouTube에서 보기 ↗
                      </a>
                    ) : (
                      "등록된 영상이 없습니다"
                    )}
                  </p>
                </>
              )}
            </div>
          </section>

          {/* Playlists */}
          <section className="flex flex-col gap-4">
            <SectionHead
              kickerNode={<p className={kicker}>PLAYLISTS · 이 아티스트가 들어간 플레이리스트</p>}
              title="포함된 플레이리스트"
            />
            {playlists.length === 0 ? (
              <p className="text-sm text-[#6e6b65]">포함된 플레이리스트가 없습니다.</p>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2">
                {playlists.slice(0, 2).map((pl) => {
                  const q = albumQueue(pl);
                  const minutes = Math.round(
                    pl.album_tracks.reduce((sum, t) => sum + (t.duration ?? 0), 0) / 60,
                  );
                  return (
                    <button
                      key={pl.id}
                      type="button"
                      onClick={() => playAlbum(pl)}
                      disabled={q.length === 0}
                      className="flex min-w-0 items-center gap-[14px] rounded-[12px] border border-[#262626] bg-[#151515] p-[14px] text-left transition-colors hover:border-[#3d3d3d] disabled:opacity-60"
                    >
                      <span className="relative size-[72px] shrink-0 overflow-hidden rounded-[6px] bg-[#0a0a0a]">
                        {pl.cover_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={pl.cover_url} alt="" className="h-full w-full object-cover" />
                        ) : null}
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col gap-1">
                        <span className={`truncate text-[14px] font-bold text-[#f4f1ea] ${display}`}>{pl.title}</span>
                        <span className={`${mono} text-[10px] font-medium text-[#6e6b65]`}>
                          {pl.album_tracks.length} TRACKS · {minutes} MIN
                        </span>
                      </span>
                      <span className="shrink-0 text-[#f4f1ea]">
                        <PlayIcon />
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          {/* Magazine */}
          <section className="flex flex-col gap-4">
            <SectionHead
              kickerNode={
                <p className="text-[11px] font-medium tracking-[1.4px] text-[#fbc201]">
                  떠돌이말 · {artist.name}
                </p>
              }
              title="관련 매거진"
              meta={`${artist.name} 태그 글 →`}
              href="/magazine"
            />
            {magazine.length === 0 ? (
              <p className="text-sm text-[#6e6b65]">관련 매거진 글이 없습니다.</p>
            ) : (
              <div className="grid gap-5 md:grid-cols-2">
                {magazine.slice(0, 2).map((post) => (
                  <Link
                    key={post.id}
                    href={
                      post.slug
                        ? `/magazine/${encodeURIComponent(post.slug)}`
                        : `/magazine/${encodeURIComponent(post.id)}`
                    }
                    className="flex flex-col border border-[#3d3d3d] px-2 pb-[14px] pt-2 transition-colors hover:border-[#a8a49b]"
                  >
                    <div className="relative h-[246px] w-full overflow-hidden bg-[#151515]">
                      {post.cover_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={post.cover_url} alt="" className="h-full w-full object-cover" />
                      ) : null}
                    </div>
                    <div className="flex flex-col gap-2.5 px-2 pt-[14px]">
                      <div className="flex items-start">
                        <span className={`text-[11px] font-medium text-[#a8a49b] ${display}`}>
                          {post.published_at
                            ? new Date(post.published_at).toLocaleDateString("ko-KR")
                            : "[발행일]"}
                        </span>
                        <span className="flex-1" />
                        <span className="text-[11px] font-medium text-[#6e6b65]">떠돌이말</span>
                      </div>
                      <p className="text-[16px] font-bold leading-[22px] text-[#f4f1ea]">{post.title}</p>
                      <div className="flex flex-wrap gap-1.5 pt-1.5">
                        {["음악", artist.name].map((tag) => (
                          <span
                            key={tag}
                            className="border border-[#3d3d3d] px-[9px] py-[5px] text-[12px] font-medium text-[#f4f1ea]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Merch */}
          <section className="flex flex-col gap-4">
            <SectionHead
              kickerNode={<p className={kicker}>MERCH · 관련 머천다이즈</p>}
              title="관련 머천"
              meta="코리아할렘 암시장 →"
              href="/sale"
            />
            {merch.length === 0 ? (
              <p className="text-sm text-[#6e6b65]">관련 머천이 없습니다.</p>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2">
                {merch.slice(0, 2).map((p) => (
                  <Link
                    key={p.id}
                    href={`/sale/${p.id}`}
                    className="flex min-w-0 items-center gap-[14px] rounded-[12px] border border-[#262626] bg-[#151515] p-[14px] transition-colors hover:border-[#3d3d3d]"
                  >
                    <span className="relative size-[88px] shrink-0 overflow-hidden rounded-[6px] bg-[#0a0a0a]">
                      {p.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.image} alt="" className="h-full w-full object-cover" />
                      ) : null}
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col gap-1.5 font-bold">
                      <span className="text-[14px] text-[#f4f1ea]">{p.title}</span>
                      <span className={`${mono} text-[13px] text-[#a8a49b]`}>
                        {p.soldOut ? "SOLD OUT" : `₩${p.price_krw.toLocaleString("ko-KR")}`}
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Sidebar */}
        <aside className="flex w-full shrink-0 flex-col gap-5 lg:w-[340px]">
          <div className="flex flex-col rounded-[14px] border border-[#262626] bg-[#151515] p-5">
            <p className={`${mono} mb-1 text-[11px] font-medium uppercase tracking-[1.2px] text-[#fbc201]`}>
              LATEST · 최근 발매 음원
            </p>
            {latest.length === 0 ? (
              <p className="py-3 text-xs text-[#6e6b65]">재생 가능한 트랙이 없습니다.</p>
            ) : (
              latest.map((item, i) => {
                const active = currentTrack?.id === item.track.id;
                return (
                  <button
                    key={`${item.track.id}-${i}`}
                    type="button"
                    onClick={() => playFrom(item.q, item.index)}
                    className="flex items-center gap-3 border-b border-[#262626] py-[3px] text-left last:border-b-0"
                  >
                    <span
                      className={`flex size-6 shrink-0 items-center justify-center rounded-full ${
                        active ? "bg-[#fbc201] text-[#0a0a0a]" : "border border-[#3d3d3d] text-[#f4f1ea]"
                      }`}
                    >
                      {active && isPlaying ? <PauseIcon size={9} /> : <PlayIcon size={9} />}
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col py-1">
                      <span
                        className={`truncate text-[13px] font-bold ${active ? "text-[#fbc201]" : "text-[#f4f1ea]"}`}
                      >
                        {item.track.title}
                      </span>
                      <span className="truncate text-[11px] text-[#6e6b65]">
                        《{item.albumTitle}》 · {String(item.no).padStart(2, "0")}
                      </span>
                    </span>
                    <span className={`${mono} text-[11px] font-medium text-[#6e6b65]`}>
                      {formatTrackDuration(item.track.duration)}
                    </span>
                  </button>
                );
              })
            )}
          </div>

          <div className="flex flex-col gap-3 rounded-[14px] border border-[#262626] bg-[#151515] p-5">
            <p className={`${mono} text-[11px] font-medium uppercase tracking-[1.2px] text-[#fbc201]`}>INSTAGRAM</p>
            <p className="truncate text-[16px] font-bold text-[#f4f1ea]">{igHandle ?? "@—"}</p>
            {artist.instagram_url ? (
              <a
                href={artist.instagram_url}
                target="_blank"
                rel="noreferrer"
                className="flex justify-center border border-[#3d3d3d] px-4 py-2.5 text-[12px] font-bold text-[#f4f1ea] transition-colors hover:border-[#a8a49b]"
              >
                인스타그램에서 보기 ↗
              </a>
            ) : (
              <p className="text-[12px] text-[#6e6b65]">등록된 인스타그램 계정이 없습니다.</p>
            )}
          </div>

          <div className="flex flex-col gap-2.5 rounded-[14px] border border-[#262626] bg-[#151515] p-5">
            <p className="text-[14px] font-bold text-[#f4f1ea]">새 음반 알림</p>
            <p className="text-[12px] leading-[18px] text-[#a8a49b]">
              이 아티스트가 새 음반을 내면 알려드려요
            </p>
            <button
              type="button"
              onClick={toggleFollow}
              aria-pressed={following}
              className={`flex justify-center rounded-[2px] px-4 py-2.5 text-[12px] font-bold transition-opacity hover:opacity-90 ${
                following ? "border border-[#fbc201] text-[#fbc201]" : "bg-[#fbc201] text-[#0a0a0a]"
              }`}
            >
              {following ? "알림 받는 중" : "알림 받기"}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
