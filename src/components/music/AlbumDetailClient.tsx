"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { usePlayer } from "@/context/PlayerContext";
import { useTrackDurations } from "@/hooks/useTrackDurations";
import type { AlbumWithTracks } from "@/lib/albums";
import { getAlbumArtistName, isPricedForSale, mapAlbumToPlayerTracks } from "@/lib/albums";
import { formatKrwPrice } from "@/lib/musicCatalog";
import { music } from "@/lib/musicTheme";
import type { ProductWithImages } from "@/lib/products";
import { getProductImages } from "@/lib/products";

type RelatedAlbum = {
  id: string;
  title: string;
  artist: string;
  cover_url: string | null;
};

interface AlbumDetailClientProps {
  album: AlbumWithTracks;
  relatedAlbums?: RelatedAlbum[];
  relatedMerch?: ProductWithImages[];
}

function formatDuration(sec?: number | null) {
  if (!sec || !isFinite(sec)) return "—";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

type DigitalFmt = "mp3" | "wav" | "flac";

/**
 * E-04 — Figma `136:470` 앨범 상세.
 * LP/카세트·Supported by·Playlist·코멘트는 시안 레이아웃 유지 · 데이터 없는 항목은 대기 표기.
 * 재생 = 하단 I-06 MusicPlayer.
 */
export function AlbumDetailClient({
  album,
  relatedAlbums = [],
  relatedMerch = [],
}: AlbumDetailClientProps) {
  const { addItem } = useCart();
  const { currentTrack, isPlaying, playQueue, play, pause } = usePlayer();
  const [digitalFmt, setDigitalFmt] = useState<DigitalFmt>("mp3");
  const [shareHint, setShareHint] = useState(false);

  const playerTracks = mapAlbumToPlayerTracks(album);
  const sortedTracks = useMemo(
    () => [...album.album_tracks].sort((a, b) => a.track_order - b.track_order),
    [album.album_tracks],
  );
  const loadedDurations = useTrackDurations(sortedTracks);
  const artist = getAlbumArtistName(album);
  const priced = isPricedForSale(album.digital_price_krw);
  const releaseLabel = album.created_at
    ? new Date(album.created_at).toLocaleDateString("ko-KR")
    : "발매";

  const totalSec = sortedTracks.reduce((sum, t) => {
    const d = t.duration ?? loadedDurations[t.id] ?? 0;
    return sum + (Number.isFinite(d) ? d : 0);
  }, 0);

  const handlePlayTrack = (trackId: string) => {
    const index = playerTracks.findIndex((t) => t.id === trackId);
    if (index < 0) return;
    if (currentTrack?.id === trackId) {
      if (isPlaying) pause();
      else play();
      return;
    }
    playQueue(playerTracks, index);
  };

  const isAlbumQueueActive =
    currentTrack?.albumId === album.id && playerTracks.some((t) => t.id === currentTrack.id);

  const addDigital = () => {
    if (!priced) return;
    addItem({
      productId: album.id,
      title: `${album.title} (Digital · ${digitalFmt.toUpperCase()})`,
      imageUrl: album.cover_url,
      priceKrw: album.digital_price_krw as number,
      kind: "digital_album",
      albumId: album.id,
    });
  };

  const onShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShareHint(true);
      window.setTimeout(() => setShareHint(false), 1800);
    } catch {
      setShareHint(true);
      window.setTimeout(() => setShareHint(false), 1800);
    }
  };

  return (
    <div className={`relative overflow-hidden ${music.font} text-[#f4f1ea]`}>
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(ellipse 45% 30% at 50% 10%, rgba(30,41,59,0.35), transparent), radial-gradient(ellipse 30% 25% at 80% 50%, rgba(25,20,35,0.4), transparent)",
          }}
        />
        <Image
          src="/figma/f-atmosphere/pin-prick-stars.svg"
          alt=""
          fill
          className="object-cover opacity-70"
          unoptimized
        />
        <Image
          src="/figma/f-atmosphere/anamorphic-lights.svg"
          alt=""
          fill
          className="object-cover opacity-60"
          unoptimized
        />
      </div>

      <div className="relative mx-auto flex w-full max-w-[1280px] flex-col gap-14 px-4 pb-32 pt-8 sm:px-8 md:gap-16 md:px-10 lg:px-14">
        <p className="font-mono text-[11px] tracking-[0.8px] text-[#6e6b65]">
          <Link href="/music" className="hover:text-[#f4f1ea]">
            MUSIC / 코리아할렘 셀렉츠
          </Link>
          {"  /  "}
          {album.artist_id ? (
            <Link href={`/artists/${album.artist_id}`} className="hover:text-[#f4f1ea]">
              {artist}
            </Link>
          ) : (
            artist
          )}
          {"  /  "}
          <span className="text-[#a8a49b]">《{album.title}》</span>
        </p>

        {/* Release */}
        <section className="grid gap-10 lg:grid-cols-[minmax(0,540px)_1fr] lg:gap-12">
          <div className="flex flex-col gap-3">
            <div className="relative aspect-square w-full overflow-hidden bg-[#151515]">
              {album.cover_url ? (
                <Image
                  src={album.cover_url}
                  alt={album.title}
                  fill
                  className="object-cover"
                  priority
                  sizes="540px"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-[#6e6b65]">KH</div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                '12" LP 실물 사진\n(게이트폴드 펼친 컷)',
                "카세트 C-46\nJ-카드 사진",
                "관련 머천\n(연결 대기)",
                "LP + 카세트 + 머천\n세트 컷",
              ].map((label) => (
                <div
                  key={label}
                  className="flex aspect-square items-center justify-center border border-[#262626] bg-[#151515] p-2 text-center text-[11px] font-medium leading-snug text-[#6e6b65] whitespace-pre-line"
                >
                  {label}
                </div>
              ))}
            </div>
          </div>

          <div className="min-w-0">
            <Link
              href={album.artist_id ? `/artists/${album.artist_id}` : "/artists"}
              className="text-[22px] font-bold text-[#f4f1ea] hover:text-[#FBC201] md:text-[26px]"
            >
              {artist}
            </Link>
            <h1 className="mt-1 text-[20px] font-normal leading-snug text-[#f4f1ea] md:text-[22px]">
              《{album.title}》
            </h1>
            <div className="flex flex-wrap items-center gap-3 pb-[18px] pt-2.5 text-[12px]">
              <span className="font-medium text-[#FBC201] underline decoration-solid">koreaharlem</span>
              <span className="font-mono text-[#6e6b65]">
                KOHAR-{album.id.slice(0, 4).toUpperCase()}
              </span>
              <span className="font-medium text-[#FBC201]">[{releaseLabel}]</span>
            </div>

            <div className="h-px w-full bg-[#262626]" />

            {/* LP — 시안 레이아웃 · 실물 SKU 연동 대기 */}
            <div className="flex flex-col gap-2 py-4 opacity-55">
              <div className="flex items-center gap-3 text-[14px] font-bold">
                <p className="flex-1">12&quot; LP · 180g 한정 (Gatefold)</p>
                <p className="font-mono">₩39,000</p>
              </div>
              <p className="text-[12px] text-[#a8a49b]">·  180g 헤비웨이트 블랙 버진 바이닐</p>
              <p className="text-[12px] text-[#a8a49b]">·  게이트폴드 슬리브</p>
              <p className="text-[12px] text-[#a8a49b]">·  배송비 ₩3,500 · 5만원 이상 무료배송</p>
              <div className="flex items-center gap-2 pt-1">
                <span className="h-1.5 w-1.5 rounded-full bg-[#6e6b65]" />
                <span className="text-[11px] text-[#a8a49b]">실물 연동 대기</span>
                <span className="flex-1" />
                <button
                  type="button"
                  disabled
                  className="cursor-not-allowed rounded-[4px] bg-[#3d3d3d] px-3 py-1.5 text-[12px] font-bold text-[#6e6b65]"
                >
                  장바구니 담기
                </button>
              </div>
            </div>

            <div className="h-px w-full bg-[#262626]" />

            <div className="flex flex-col gap-2 py-4 opacity-55">
              <div className="flex items-center gap-3 text-[14px] font-bold">
                <p className="flex-1">카세트 C-46 (Chrome Type II)</p>
                <p className="font-mono">₩18,000</p>
              </div>
              <p className="text-[12px] text-[#a8a49b]">·  리소그래프 3도 인쇄 J-카드</p>
              <p className="text-[12px] text-[#a8a49b]">·  을지로 공방에서 손으로 조립</p>
              <div className="flex items-center gap-2 pt-1">
                <span className="h-1.5 w-1.5 rounded-full bg-[#6e6b65]" />
                <span className="text-[11px] text-[#a8a49b]">실물 연동 대기</span>
                <span className="flex-1" />
                <button
                  type="button"
                  disabled
                  className="cursor-not-allowed rounded-[4px] bg-[#3d3d3d] px-3 py-1.5 text-[12px] font-bold text-[#6e6b65]"
                >
                  장바구니 담기
                </button>
              </div>
            </div>

            <div className="h-px w-full bg-[#262626]" />

            {/* Digital — 동작 */}
            <div className="flex flex-col gap-2.5 py-4">
              <div className="flex items-start gap-3 text-[14px] font-bold">
                <p className="flex-1">디지털 다운로드</p>
                <p className="font-mono">
                  {priced ? `${formatKrwPrice(album.digital_price_krw as number)}~` : "STREAM"}
                </p>
              </div>
              <p className="text-[12px] text-[#6e6b65]">형식 선택</p>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ["mp3", "MP3 320"],
                    ["wav", "WAV"],
                    ["flac", "FLAC"],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setDigitalFmt(key)}
                    className={`rounded-[4px] px-3 py-1.5 font-mono text-[12px] ${
                      digitalFmt === key
                        ? "bg-[#f4f1ea] font-medium text-[#0a0a0a]"
                        : "border border-[#3d3d3d] text-[#f4f1ea]"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <div className="flex items-center gap-1.5 rounded-[4px] border border-[#262626] bg-[#151515] px-3 py-1.5">
                  <span className="font-mono text-[12px] text-[#6e6b65]">₩</span>
                  <span className="font-mono text-[13px] font-bold">
                    {priced ? album.digital_price_krw!.toLocaleString("ko-KR") : "—"}
                  </span>
                </div>
                <span className="text-[11px] text-[#6e6b65]">원하는 만큼 더 낼 수 있어요</span>
                <span className="flex-1" />
                <button
                  type="button"
                  disabled={!priced}
                  onClick={addDigital}
                  className="rounded-[4px] bg-[#FBC201] px-3 py-1.5 text-[12px] font-bold text-[#0a0a0a] disabled:cursor-not-allowed disabled:bg-[#3d3d3d] disabled:text-[#6e6b65]"
                >
                  구매하기
                </button>
              </div>
              <p className="text-[11px] text-[#6e6b65]">
                구매 후 MY MUSIC에서 다운로드 · 스트리밍은 누구나 무료
              </p>
            </div>

            <div className="h-px w-full bg-[#262626]" />

            <div className="flex flex-wrap gap-2 py-4">
              <button
                type="button"
                disabled={playerTracks.length === 0}
                onClick={() => playerTracks[0] && handlePlayTrack(playerTracks[0].id)}
                className="rounded-[4px] border border-[#3d3d3d] px-3 py-1.5 text-[12px] font-medium text-[#f4f1ea] hover:border-[#FBC201]"
              >
                ▶  재생
              </button>
              <Link
                href="/mypage/wishlist"
                className="rounded-[4px] border border-[#3d3d3d] px-3 py-1.5 text-[12px] font-medium text-[#f4f1ea] hover:border-[#a8a49b]"
              >
                ♡  위시리스트
              </Link>
              <button
                type="button"
                onClick={onShare}
                className="rounded-[4px] border border-[#3d3d3d] px-3 py-1.5 text-[12px] font-medium text-[#f4f1ea] hover:border-[#a8a49b]"
              >
                ↗  공유
              </button>
              {shareHint && (
                <span className="self-center text-[11px] text-[#FBC201]">링크 복사됨</span>
              )}
            </div>

            {album.description ? (
              <p className="whitespace-pre-wrap text-[13px] leading-[21px] text-[#FBC201]">
                {album.description}
              </p>
            ) : (
              <p className="text-[13px] leading-[21px] text-[#FBC201]">
                [앨범 소개 3~5문장 — 아티스트 확인 후 게시]
              </p>
            )}
          </div>
        </section>

        {/* Tracklist */}
        <section>
          <div className="flex items-center gap-3 py-1.5">
            <h2 className="text-[15px] font-bold">디지털 트랙리스트</h2>
            <span className="h-px flex-1 bg-[#3d3d3d]" />
            <span className="text-[11px] font-medium text-[#6e6b65]">
              {sortedTracks.length}곡 · {formatDuration(totalSec)} · 스트리밍 무료
            </span>
          </div>
          <div className="h-px bg-[#3d3d3d]" />
          {sortedTracks.map((track, index) => {
            const isActive = isAlbumQueueActive && currentTrack?.id === track.id;
            const trackDuration = track.duration ?? loadedDurations[track.id] ?? null;
            const playable = Boolean(track.audio_url);
            return (
              <div key={track.id}>
                <button
                  type="button"
                  disabled={!playable}
                  onClick={() => playable && handlePlayTrack(track.id)}
                  className="flex w-full items-center gap-3 px-1 py-2 text-left disabled:opacity-40"
                >
                  <span className="w-5 font-mono text-[12px] text-[#6e6b65]">{index + 1}</span>
                  <span
                    className={`w-3 text-center text-[9px] font-bold ${
                      isActive ? "text-[#FBC201]" : "text-[#6e6b65]"
                    }`}
                  >
                    {isActive && isPlaying ? "❚❚" : "▶"}
                  </span>
                  <span
                    className={`min-w-0 flex-1 text-[13px] ${
                      isActive
                        ? "font-bold text-[#FBC201]"
                        : "font-normal text-[#f4f1ea] underline decoration-transparent hover:decoration-current"
                    }`}
                  >
                    {track.title}
                    {track.is_title_track ? (
                      <span className="ml-2 font-mono text-[9px] text-[#FBC201]">TITLE</span>
                    ) : null}
                  </span>
                  <span className="font-mono text-[12px] text-[#a8a49b]">
                    {formatDuration(trackDuration)}
                  </span>
                </button>
                <div className="h-px bg-[#262626]" />
              </div>
            );
          })}
        </section>

        {/* Playlist — 모델 대기 */}
        <section>
          <div className="mb-4 flex items-end gap-3">
            <div>
              <p className="font-mono text-[11px] tracking-[1.4px] text-[#FBC201]">
                PLAYLIST · 플레이리스트
              </p>
              <h2 className="mt-1 text-[22px] font-black tracking-[-0.4px]">포함된 플레이리스트</h2>
            </div>
          </div>
          <p className="rounded-[10px] border border-[#262626] bg-[#151515] px-4 py-6 text-[13px] text-[#6e6b65]">
            플레이리스트 모델 연동 대기 — 시안 섹션 자리입니다.
          </p>
        </section>

        {/* Supported by */}
        <section>
          <div className="mb-4">
            <p className="font-mono text-[11px] tracking-[1.4px] text-[#FBC201]">SUPPORTED BY</p>
            <h2 className="mt-1 text-[22px] font-black tracking-[-0.4px]">Supported by</h2>
          </div>
          <p className="text-[12px] text-[#a8a49b]">
            구매할 때 &quot;Supported by에 닉네임 공개&quot;를 체크한 사람만 보여요. (E-09 연동 대기)
          </p>
          <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-[#262626] bg-[#151515] text-[10px] text-[#6e6b65]"
              >
                —
              </div>
            ))}
          </div>
          <p className="mt-6 text-[11px] text-[#6e6b65]">
            ※ 구매한 사람만 한 줄 코멘트를 남길 수 있어요 (200자) · 코멘트 UI는 Supported by 연동 후
          </p>
        </section>

        {/* Related */}
        <section>
          <div className="mb-5 flex items-end justify-between gap-3">
            <div>
              <p className="font-mono text-[11px] tracking-[1.4px] text-[#FBC201]">MORE</p>
              <h2 className="mt-1 text-[22px] font-black tracking-[-0.4px]">같이 보면 좋은 것</h2>
            </div>
            <Link href="/music/albums" className="text-[13px] text-[#a8a49b] hover:text-[#f4f1ea]">
              더보기 →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {relatedAlbums.map((item) => (
              <Link key={item.id} href={`/music/album/${item.id}`} className="group flex flex-col gap-2">
                <div className="relative aspect-square overflow-hidden bg-[#151515]">
                  {item.cover_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.cover_url}
                      alt={item.title}
                      className="h-full w-full object-cover transition group-hover:scale-105"
                    />
                  ) : null}
                </div>
                <p className="line-clamp-2 text-[13px] font-bold group-hover:text-[#FBC201]">
                  {item.title}
                </p>
                <p className="truncate text-[12px] text-[#a8a49b]">{item.artist}</p>
              </Link>
            ))}
            {relatedMerch.map((product) => {
              const image = getProductImages(product)[0];
              return (
                <Link
                  key={product.id}
                  href={`/sale/${product.id}`}
                  className="group flex flex-col gap-2"
                >
                  <div className="relative aspect-square overflow-hidden bg-[#151515]">
                    {image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={image}
                        alt={product.title}
                        className="h-full w-full object-cover transition group-hover:scale-105"
                      />
                    ) : null}
                  </div>
                  <p className="line-clamp-2 text-[13px] font-bold group-hover:text-[#FBC201]">
                    {product.title}
                  </p>
                  <p className="font-mono text-[12px] text-[#a8a49b]">
                    {formatKrwPrice(product.price_krw)}
                  </p>
                </Link>
              );
            })}
            {relatedAlbums.length === 0 && relatedMerch.length === 0 && (
              <p className="col-span-full text-sm text-[#6e6b65]">추천 항목이 아직 없습니다.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
