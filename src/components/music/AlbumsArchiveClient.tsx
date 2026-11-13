"use client";

import { useEffect, useMemo, useState } from "react";
import { AlbumCoverPlayCard } from "@/components/music/AlbumCoverPlayCard";
import { MusicArchiveShell } from "@/components/music/MusicArchiveShell";
import type { MusicAlbumCard } from "@/lib/musicCatalog";

type SortKey = "added" | "title" | "artist";

const PAGE_SIZE = 8;
const COLUMNS = 4;

/** 장르 칩 — 앨범 설명/제목에서 키워드 매칭 (장르 컬럼 도입 전까지) */
const GENRES: { label: string; keywords: string[] }[] = [
  { label: "AMBIENT", keywords: ["ambient", "앰비언트"] },
  { label: "NOISE / DRONE", keywords: ["noise", "drone", "노이즈", "드론"] },
  { label: "POST-PUNK", keywords: ["post-punk", "postpunk", "포스트펑크", "포스트 펑크"] },
  { label: "LO-FI", keywords: ["lo-fi", "lofi", "로파이"] },
  { label: "ELECTRONIC", keywords: ["electronic", "일렉트로닉", "electronica"] },
];

const SORT_LABEL: Record<SortKey, string> = {
  added: "추가일순",
  title: "제목순",
  artist: "아티스트순",
};

export function AlbumsArchiveClient({ albums }: { albums: MusicAlbumCard[] }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("added");
  const [genre, setGenre] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = albums;
    if (genre) {
      const keywords = GENRES.find((g) => g.label === genre)?.keywords ?? [];
      list = list.filter((a) => {
        const hay = `${a.title} ${a.description ?? ""}`.toLowerCase();
        return keywords.some((k) => hay.includes(k));
      });
    }
    if (q) {
      list = list.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.artist.toLowerCase().includes(q) ||
          a.tracks.some((t) => t.title.toLowerCase().includes(q)),
      );
    }
    const sorted = [...list];
    if (sort === "title") sorted.sort((a, b) => a.title.localeCompare(b.title, "ko"));
    else if (sort === "artist") sorted.sort((a, b) => a.artist.localeCompare(b.artist, "ko"));
    else sorted.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
    return sorted;
  }, [albums, query, sort, genre]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  useEffect(() => {
    if (page !== safePage) setPage(safePage);
  }, [page, safePage]);

  const shown = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const fillers =
    shown.length > 0 && !query.trim() && !genre
      ? (COLUMNS - (shown.length % COLUMNS)) % COLUMNS
      : 0;

  const chipBase =
    "border px-[7px] py-[3px] text-[10px] font-medium leading-normal transition-colors";

  return (
    <MusicArchiveShell
      active="albums"
      crumb="음반"
      title="음반"
      titleStyle="korean"
      sub="코리아할렘이 고른 싱글 · EP · 정규 앨범"
      count={`${String(albums.length).padStart(2, "0")} ALBUMS`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => {
            setGenre(null);
            setPage(1);
          }}
          className={`${chipBase} ${
            genre === null
              ? "border-[#f4f1ea] bg-[#f4f1ea] text-[#0a0a0a]"
              : "border-[#3d3d3d] text-[#f4f1ea] hover:border-[#a8a49b]"
          }`}
        >
          전체
        </button>
        {GENRES.map((g) => (
          <button
            key={g.label}
            type="button"
            onClick={() => {
              setGenre(genre === g.label ? null : g.label);
              setPage(1);
            }}
            className={`${chipBase} ${
              genre === g.label
                ? "border-[#f4f1ea] bg-[#f4f1ea] text-[#0a0a0a]"
                : "border-[#3d3d3d] text-[#f4f1ea] hover:border-[#a8a49b]"
            }`}
          >
            {g.label}
          </button>
        ))}
        <div className="hidden h-px min-w-px flex-1 md:block" />
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
          placeholder="앨범, 아티스트 검색"
          aria-label="앨범, 아티스트 검색"
          className="w-full rounded-[6px] border border-[#262626] bg-transparent px-3.5 py-[9px] text-[12px] text-[#f4f1ea] outline-none placeholder:text-[#6e6b65] focus:border-[#a8a49b] md:w-[220px]"
        />
        <label className="relative flex items-center pl-3 text-[12px] font-medium text-[#a8a49b]">
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value as SortKey);
              setPage(1);
            }}
            aria-label="정렬"
            className="cursor-pointer appearance-none bg-transparent pr-4 outline-none"
          >
            {(Object.keys(SORT_LABEL) as SortKey[]).map((k) => (
              <option key={k} value={k} className="bg-[#0a0a0a] text-[#f4f1ea]">
                {SORT_LABEL[k]}
              </option>
            ))}
          </select>
          <span aria-hidden className="pointer-events-none absolute right-0">
            ▾
          </span>
        </label>
      </div>

      {filtered.length === 0 ? (
        <p className="py-10 text-[13px] text-[#a8a49b]">앨범이 없습니다.</p>
      ) : (
        <div className="grid grid-cols-2 gap-x-6 gap-y-9 md:grid-cols-3 lg:grid-cols-4">
          {shown.map((album) => (
            <AlbumCoverPlayCard key={album.id} album={album} />
          ))}
          {Array.from({ length: fillers }).map((_, i) => (
            <div
              key={`filler-${i}`}
              aria-hidden
              className="hidden aspect-square items-center justify-center border border-dashed border-[#262626] text-[12px] font-medium text-[#6e6b65] lg:flex"
            >
              새 앨범 자리
            </div>
          ))}
        </div>
      )}

      <nav
        aria-label="페이지"
        className="flex items-start justify-center gap-1.5 pt-4 [font-family:var(--font-f-display),var(--font-f-sans),sans-serif]"
      >
        <button
          type="button"
          onClick={() => setPage(Math.max(1, safePage - 1))}
          disabled={safePage <= 1}
          aria-label="이전 페이지"
          className="flex size-9 items-center justify-center rounded-[6px] border border-[#262626] text-[12px] font-bold text-[#a8a49b] transition hover:border-[#a8a49b] disabled:opacity-40"
        >
          ‹
        </button>
        {Array.from({ length: totalPages }).map((_, i) => {
          const n = i + 1;
          const on = n === safePage;
          return (
            <button
              key={n}
              type="button"
              onClick={() => setPage(n)}
              aria-current={on ? "page" : undefined}
              className={`flex size-9 items-center justify-center rounded-[6px] text-[12px] font-bold transition ${
                on
                  ? "bg-[#f4f1ea] text-[#0a0a0a]"
                  : "border border-[#262626] text-[#a8a49b] hover:border-[#a8a49b]"
              }`}
            >
              {n}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setPage(Math.min(totalPages, safePage + 1))}
          disabled={safePage >= totalPages}
          aria-label="다음 페이지"
          className="flex size-9 items-center justify-center rounded-[6px] border border-[#262626] text-[12px] font-bold text-[#a8a49b] transition hover:border-[#a8a49b] disabled:opacity-40"
        >
          ›
        </button>
      </nav>

      <p className="text-[12px] text-[#6e6b65]">
        ※ 스트리밍은 누구나 무료 · 다운로드(MP3 320kbps / WAV)는 구매 후 MY MUSIC에서. 정가 이상 후원 결제는 미정
      </p>
    </MusicArchiveShell>
  );
}
