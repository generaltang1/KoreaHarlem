"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { usePlayer } from "@/context/PlayerContext";
import { useTrackDurations } from "@/hooks/useTrackDurations";
import type { AlbumWithTracks } from "@/lib/albums";
import { getAlbumArtistName, isPricedForSale, mapAlbumToPlayerTracks } from "@/lib/albums";
import { formatKrwPrice } from "@/lib/musicCatalog";
import type { AlbumSupporterPublic } from "@/lib/musicSupporters";
import { supporterInitials } from "@/lib/musicSupporters";
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
  supporters?: AlbumSupporterPublic[];
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
 * 재생 = 하단 I-06 MusicPlayer. 커버·사진은 등록된 것만 노출 (시안 플레이스홀더 없음).
 */
export function AlbumDetailClient({
  album,
  relatedAlbums = [],
  relatedMerch = [],
  supporters = [],
}: AlbumDetailClientProps) {
  const { addItem } = useCart();
  const { currentTrack, isPlaying, playQueue, play, pause } = usePlayer();
  const [digitalFmt, setDigitalFmt] = useState<DigitalFmt>("mp3");
  const [tipKrw, setTipKrw] = useState("0");
  const [shareHint, setShareHint] = useState(false);

  const playerTracks = mapAlbumToPlayerTracks(album);
  const sortedTracks = useMemo(
    () => [...album.album_tracks].sort((a, b) => a.track_order - b.track_order),
    [album.album_tracks],
  );
  const availableFormats = useMemo(() => {
    const hasMp3 = sortedTracks.some((t) => Boolean(t.download_mp3_url || t.audio_url));
    const hasWav = sortedTracks.some((t) => Boolean(t.download_wav_url));
    const hasFlac = sortedTracks.some((t) => Boolean(t.download_flac_url));
    const list: { key: DigitalFmt; label: string }[] = [];
    if (hasMp3) list.push({ key: "mp3", label: "MP3 320" });
    if (hasWav) list.push({ key: "wav", label: "WAV" });
    if (hasFlac) list.push({ key: "flac", label: "FLAC" });
    return list;
  }, [sortedTracks]);
  useEffect(() => {
    if (availableFormats.length === 0) return;
    if (!availableFormats.some((f) => f.key === digitalFmt)) {
      setDigitalFmt(availableFormats[0].key);
    }
  }, [availableFormats, digitalFmt]);
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

  const lyricsTrack = useMemo(() => {
    if (isAlbumQueueActive && currentTrack) {
      return sortedTracks.find((t) => t.id === currentTrack.id) ?? null;
    }
    return sortedTracks.find((t) => t.is_title_track) ?? sortedTracks[0] ?? null;
  }, [isAlbumQueueActive, currentTrack, sortedTracks]);

  const basePrice = priced ? (album.digital_price_krw as number) : 0;
  const tipAmount = (() => {
    const n = Number(String(tipKrw).replace(/,/g, "").trim());
    if (!Number.isFinite(n) || n < 0) return 0;
    return Math.round(n);
  })();
  const orderPrice = basePrice + tipAmount;

  const addDigital = () => {
    if (!priced) return;
    const tipLabel = tipAmount > 0 ? ` · +₩${tipAmount.toLocaleString("ko-KR")}` : "";
    addItem({
      productId: album.id,
      title: `${album.title} (Digital · ${digitalFmt.toUpperCase()}${tipLabel})`,
      imageUrl: album.cover_url,
      priceKrw: orderPrice,
      size: digitalFmt,
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
        <section
          className={`grid gap-10 lg:gap-12 ${
            album.cover_url ? "lg:grid-cols-[minmax(0,540px)_1fr]" : ""
          }`}
        >
          {album.cover_url ? (
            <div className="relative aspect-square w-full overflow-hidden bg-[#151515]">
              <Image
                src={album.cover_url}
                alt={album.title}
                fill
                className="object-cover"
                priority
                sizes="540px"
              />
            </div>
          ) : null}

          <div className="min-w-0">
            <Link
              href={album.artist_id ? `/artists/${album.artist_id}` : "/artists"}
              className="text-[24px] font-bold text-[#f4f1ea] hover:text-[#FBC201] md:text-[28px]"
            >
              {artist}
            </Link>
            <h1 className="mt-1 text-[22px] font-normal leading-snug text-[#f4f1ea] md:text-[26px]">
              《{album.title}》
            </h1>
            <div className="flex flex-wrap items-center gap-3 pb-[18px] pt-2.5 text-[14px]">
              <span className="font-medium text-[#FBC201] underline decoration-solid">koreaharlem</span>
              <span className="font-mono text-[#6e6b65]">
                KOHAR-{album.id.slice(0, 4).toUpperCase()}
              </span>
              <span className="font-medium text-[#FBC201]">[{releaseLabel}]</span>
            </div>

            <div className="h-px w-full bg-[#262626]" />

            {/* Digital — 동작 */}
            <div className="flex flex-col gap-3 py-4">
              <div className="flex items-start gap-3 text-[17px] font-bold">
                <p className="flex-1">디지털 다운로드</p>
                <p className="font-mono text-[20px] md:text-[22px]">
                  {priced ? `${formatKrwPrice(album.digital_price_krw as number)}~` : "STREAM"}
                </p>
              </div>
              {availableFormats.length > 0 ? (
                <>
                  <p className="text-[14px] text-[#6e6b65]">형식 선택</p>
                  <div className="flex flex-wrap gap-2">
                    {availableFormats.map(({ key, label }) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setDigitalFmt(key)}
                        className={`rounded-[4px] px-3.5 py-2 font-mono text-[14px] ${
                          digitalFmt === key
                            ? "bg-[#f4f1ea] font-medium text-[#0a0a0a]"
                            : "border border-[#3d3d3d] text-[#f4f1ea]"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </>
              ) : null}
              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <label className="flex items-center gap-1.5 rounded-[4px] border border-[#262626] bg-[#151515] px-3 py-2">
                  <span className="font-mono text-[14px] text-[#6e6b65]">₩</span>
                  <input
                    type="number"
                    min={0}
                    step={100}
                    inputMode="numeric"
                    disabled={!priced}
                    value={tipKrw}
                    onChange={(e) => setTipKrw(e.target.value)}
                    onBlur={() => {
                      if (!String(tipKrw).trim() || tipAmount < 0) setTipKrw("0");
                      else setTipKrw(String(tipAmount));
                    }}
                    aria-label="추가 지불 금액"
                    className="w-[7.5rem] bg-transparent font-mono text-[16px] font-bold text-[#f4f1ea] outline-none disabled:opacity-50"
                  />
                </label>
                <span className="text-[13px] text-[#6e6b65]">원하는 만큼 더 낼 수 있어요 (기본 0)</span>
                <span className="flex-1" />
                <div className="flex flex-wrap items-center gap-2">
                  {priced ? (
                    <span className="font-mono text-[15px] font-bold text-[#f4f1ea]">
                      합계 {formatKrwPrice(orderPrice)}
                    </span>
                  ) : null}
                  <button
                    type="button"
                    disabled={!priced}
                    onClick={addDigital}
                    className="rounded-[4px] bg-[#FBC201] px-4 py-2 text-[14px] font-bold text-[#0a0a0a] disabled:cursor-not-allowed disabled:bg-[#3d3d3d] disabled:text-[#6e6b65]"
                  >
                    구매하기
                  </button>
                </div>
              </div>
              <p className="text-[13px] text-[#6e6b65]">
                기본가 {priced ? formatKrwPrice(basePrice) : "—"}
                {tipAmount > 0 ? ` + 추가 ${formatKrwPrice(tipAmount)}` : ""}
                {" · "}
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
            <h2 className="text-[15px] font-bold">트랙리스트</h2>
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

        {/* Lyrics — 시안 자리 · track.description 있으면 표시 */}
        <section className="rounded-[10px] border border-[#262626] bg-[#151515] p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-[15px] font-bold">가사</h2>
            {lyricsTrack && isAlbumQueueActive && currentTrack?.id === lyricsTrack.id ? (
              <span className="rounded-[4px] bg-[#FBC201] px-1.5 py-0.5 font-mono text-[9px] font-bold text-[#0a0a0a]">
                NOW PLAYING
              </span>
            ) : null}
            {lyricsTrack ? (
              <span className="text-[12px] text-[#a8a49b]">{lyricsTrack.title}</span>
            ) : null}
          </div>
          <p className="mt-3 whitespace-pre-wrap text-[13px] leading-[22px] text-[#a8a49b]">
            {lyricsTrack?.description?.trim()
              ? lyricsTrack.description
              : "가사가 이곳에 표시됩니다. 재생 중인 곡의 가사를 확인할 수 있습니다."}
          </p>
        </section>

        {/* Supported by */}
        <section>
          <div className="mb-4">
            <p className="font-mono text-[11px] tracking-[1.4px] text-[#FBC201]">SUPPORTED BY</p>
            <h2 className="mt-1 text-[22px] font-black tracking-[-0.4px]">Supported by</h2>
          </div>
          <p className="text-[12px] text-[#a8a49b]">
            닉네임 공개에 동의한 서포터만 보여요.
          </p>
          {supporters.length === 0 ? (
            <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-[#262626] bg-[#151515] text-[10px] text-[#6e6b65]"
                >
                  —
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
                {supporters.map((s) => (
                  <div
                    key={s.id}
                    title={s.display_name}
                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-[#3d3d3d] bg-[#151515] font-mono text-[11px] font-bold text-[#FBC201]"
                  >
                    {supporterInitials(s.display_name)}
                  </div>
                ))}
              </div>
              <ul className="mt-5 space-y-2">
                {supporters
                  .filter((s) => s.comment?.trim())
                  .slice(0, 8)
                  .map((s) => (
                    <li
                      key={`${s.id}-c`}
                      className="rounded-[8px] border border-[#262626] bg-[#151515] px-3 py-2.5 text-[13px]"
                    >
                      <span className="font-medium text-[#FBC201]">{s.display_name}</span>
                      <span className="mt-1 block text-[#a8a49b]">{s.comment}</span>
                    </li>
                  ))}
              </ul>
            </>
          )}
          <p className="mt-6 text-[11px] text-[#6e6b65]">
            ※ 한 줄 코멘트는 200자 · 구매 시 공개 체크 연동은 추후
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
                {item.cover_url ? (
                  <div className="relative aspect-square overflow-hidden bg-[#151515]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.cover_url}
                      alt={item.title}
                      className="h-full w-full object-cover transition group-hover:scale-105"
                    />
                  </div>
                ) : null}
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
                  {image ? (
                    <div className="relative aspect-square overflow-hidden bg-[#151515]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={image}
                        alt={product.title}
                        className="h-full w-full object-cover transition group-hover:scale-105"
                      />
                    </div>
                  ) : null}
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
