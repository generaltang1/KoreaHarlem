"use client";

import { useState } from "react";
import Link from "next/link";
import { mp } from "@/lib/mypageTheme";

export type OwnedAlbumRow = {
  id: string;
  title: string;
  artist: string;
  cover: string | null;
  trackCount: number;
  priceKrw?: number | null;
  tracks: { id: string; title: string; hasFile: boolean; hasWav?: boolean; duration?: number | null }[];
};

const display = "[font-family:var(--font-f-display),var(--font-f-sans),sans-serif]";

function clock(sec?: number | null) {
  if (sec == null || !Number.isFinite(sec) || sec < 0) return "--:--";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function MyMusicClient({ albums }: { albums: OwnedAlbumRow[] }) {
  const [openIds, setOpenIds] = useState<Set<string>>(
    () => new Set(albums.slice(0, 1).map((a) => a.id)),
  );

  const toggle = (id: string) =>
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  if (albums.length === 0) {
    return (
      <div className="rounded-[10px] border border-[#262626] bg-[#151515] p-8 text-center">
        <p className={`text-sm ${mp.muted}`}>구매한 디지털 앨범이 없습니다.</p>
        <Link href="/music" className="mt-4 inline-block text-xs uppercase tracking-widest underline">
          Music 둘러보기
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <ul className="flex flex-col gap-5">
        {albums.map((album) => {
          const open = openIds.has(album.id);
          const anyWav = album.tracks.some((t) => t.hasWav);
          return (
            <li
              key={album.id}
              className="overflow-hidden rounded-[10px] border border-[#262626] bg-[#151515]"
            >
              <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center">
                <Link
                  href={`/music/album/${album.id}`}
                  className="relative size-24 shrink-0 overflow-hidden bg-[#0a0a0a]"
                >
                  {album.cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={album.cover} alt="" className="h-full w-full object-cover" />
                  ) : null}
                </Link>

                <div className="flex min-w-0 flex-1 flex-col items-start gap-1.5">
                  <Link
                    href={`/music/album/${album.id}`}
                    className="text-[18px] font-bold leading-[1.3] text-[#f4f1ea] transition hover:text-[#fbc201]"
                  >
                    {album.title}
                  </Link>
                  <p className="text-[13px] font-medium text-[#a8a49b]">{album.artist}</p>
                  <p className="whitespace-pre-wrap text-[10px] font-medium tracking-[0.5px] text-[#6e6b65]">
                    {`수록곡 ${album.trackCount}개`}
                    {album.priceKrw && album.priceKrw > 0
                      ? `   ·   ₩${album.priceKrw.toLocaleString("ko-KR")}`
                      : ""}
                  </p>
                </div>

                <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
                  <a
                    href={`/api/music/download-zip?albumId=${album.id}`}
                    className={`${display} inline-flex rounded-[6px] bg-[#f4f1ea] px-4 py-[9px] text-[12px] font-bold tracking-[0.5px] text-[#0a0a0a] whitespace-pre transition hover:opacity-90`}
                  >
                    {"↓  MP3 320kbps (ZIP)"}
                  </a>
                  {anyWav ? (
                    <a
                      href={`/api/music/download-zip?albumId=${album.id}&format=wav`}
                      className={`${display} inline-flex rounded-[6px] border border-[#262626] px-4 py-[9px] text-[12px] font-bold tracking-[0.5px] text-[#f4f1ea] whitespace-pre transition hover:border-[#a8a49b]`}
                    >
                      {"↓  WAV 16bit / 44.1kHz (ZIP)"}
                    </a>
                  ) : (
                    <span
                      aria-disabled
                      title="WAV 파일이 등록되지 않았습니다"
                      className={`${display} inline-flex cursor-not-allowed rounded-[6px] border border-[#262626] px-4 py-[9px] text-[12px] font-bold tracking-[0.5px] text-[#6e6b65] whitespace-pre`}
                    >
                      {"↓  WAV 16bit / 44.1kHz (ZIP)"}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => toggle(album.id)}
                    aria-expanded={open}
                    className="text-[11px] font-medium text-[#a8a49b] transition hover:text-[#f4f1ea]"
                  >
                    {open ? "수록곡 접기 ▲" : "수록곡 보기 ▼"}
                  </button>
                </div>
              </div>

              {open ? (
                <ul className="flex flex-col px-5 pb-3">
                  {album.tracks.map((track, i) => (
                    <li
                      key={track.id}
                      className="flex items-center gap-4 border-b border-[#262626] py-2 last:border-b-0"
                    >
                      <span className="font-mono text-[11px] font-medium text-[#6e6b65]">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[14px] font-medium text-[#f4f1ea]">
                        {track.title}
                      </span>
                      <span className="hidden font-mono text-[11px] font-medium text-[#6e6b65] sm:inline">
                        {clock(track.duration)}
                      </span>
                      {track.hasFile ? (
                        <>
                          <a
                            href={`/api/music/download?trackId=${track.id}&format=file`}
                            download
                            aria-label={`${track.title} 음원다운로드`}
                            className="whitespace-nowrap text-[10px] font-medium tracking-[0.5px] text-[#a8a49b] transition hover:text-[#f4f1ea]"
                          >
                            MP3 다운로드 ↓
                          </a>
                          {track.hasWav ? (
                            <a
                              href={`/api/music/download?trackId=${track.id}&format=wav`}
                              download
                              aria-label={`${track.title} WAV 다운로드`}
                              className="whitespace-nowrap text-[10px] font-medium tracking-[0.5px] text-[#a8a49b] transition hover:text-[#f4f1ea]"
                            >
                              WAV 다운로드 ↓
                            </a>
                          ) : (
                            <span className="whitespace-nowrap text-[10px] font-medium tracking-[0.5px] text-[#6e6b65]">
                              WAV 다운로드 ↓
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-[10px] text-[#6e6b65]">파일 없음</span>
                      )}
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          );
        })}
      </ul>

      <div className="flex flex-col gap-1.5 pt-2 text-[12px] leading-[1.6]">
        <p className="text-[#a8a49b]">
          · 스트리밍은 구매 없이도 가능해요. 구매하면 원본 음질 파일과 앨범 커버를 받을 수 있어요.
        </p>
        <p className="text-[#fbc201]">· 다운로드 가능 기간 · 횟수 정책 [입력 필요]</p>
      </div>
    </div>
  );
}
