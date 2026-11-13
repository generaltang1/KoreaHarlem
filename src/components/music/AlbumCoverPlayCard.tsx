"use client";

import Link from "next/link";
import { usePlayer } from "@/context/PlayerContext";
import { formatKrwPrice, type MusicAlbumCard } from "@/lib/musicCatalog";
import { cardTracksToPlayerQueue } from "@/lib/musicPlay";
import { isPricedForSale } from "@/lib/albums";

type Props = {
  album: MusicAlbumCard;
  /** 커버 클릭 시 상세로 (기본 true). false면 재생만 */
  linkToDetail?: boolean;
};

/** E-05 앨범 카드 — Figma 306:431. 커버 좌하단 ▶ 로 앨범 순차 재생(하단 바), 제목은 상세 링크. */
export function AlbumCoverPlayCard({ album, linkToDetail = true }: Props) {
  const { playQueue, currentTrack, isPlaying, pause, play } = usePlayer();
  const queue = cardTracksToPlayerQueue(album);
  const isThis =
    currentTrack?.albumId === album.id && queue.some((t) => t.id === currentTrack.id);

  const playAlbum = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (queue.length === 0) return;
    if (isThis) {
      if (isPlaying) pause();
      else play();
      return;
    }
    playQueue(queue, 0);
  };

  const cover = album.cover_url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={album.cover_url}
      alt=""
      className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
    />
  ) : (
    <div className="flex h-full items-center justify-center text-[#6e6b65]">KH</div>
  );

  const playing = isThis && isPlaying;

  return (
    <article className="group flex min-w-0 flex-col gap-2.5">
      <div className="relative aspect-square w-full overflow-hidden bg-[#151515]">
        {linkToDetail ? (
          <Link href={`/music/album/${album.id}`} className="absolute inset-0 block">
            {cover}
          </Link>
        ) : (
          cover
        )}
        <button
          type="button"
          onClick={playAlbum}
          disabled={queue.length === 0}
          className="absolute bottom-4 left-4 flex h-11 w-11 items-center justify-center rounded-full bg-[#f4f1ea] text-[#0a0a0a] shadow-[0_2px_10px_rgba(0,0,0,0.45)] transition hover:bg-[#fbc201] disabled:cursor-not-allowed disabled:opacity-60"
          aria-label={`${album.title} 앨범 ${playing ? "일시정지" : "재생"}`}
        >
          {playing ? (
            <span aria-hidden className="flex gap-[3px]">
              <span className="h-3.5 w-[3px] bg-current" />
              <span className="h-3.5 w-[3px] bg-current" />
            </span>
          ) : (
            <span
              aria-hidden
              className="ml-[3px] h-0 w-0 border-y-[7px] border-l-[12px] border-y-transparent border-l-current"
            />
          )}
        </button>
        <span className="pointer-events-none absolute left-3 top-3 bg-[#0a0a0a] px-2 py-1 text-[9px] font-medium leading-none text-[#f4f1ea]">
          무료 듣기
        </span>
      </div>

      <Link
        href={`/music/album/${album.id}`}
        className="text-[16px] font-bold leading-[1.35] text-[#f4f1ea] transition hover:text-[#fbc201]"
      >
        {album.title}
      </Link>
      <Link
        href={album.artistId ? `/artists/${album.artistId}` : "/artists"}
        className="truncate text-[13px] font-medium text-[#a8a49b] transition hover:text-[#f4f1ea]"
      >
        {album.artist}
      </Link>
      <div className="flex items-center justify-between gap-2 font-mono font-medium">
        <span className="truncate text-[10px] uppercase tracking-[1px] text-[#6e6b65]">
          ALBUM / {album.tracks.length} TRACKS
        </span>
        <span className="shrink-0 text-[11px] tracking-[0.5px] text-[#f4f1ea]">
          {isPricedForSale(album.digital_price_krw)
            ? `DL ${formatKrwPrice(album.digital_price_krw)}`
            : "STREAM"}
        </span>
      </div>
    </article>
  );
}
