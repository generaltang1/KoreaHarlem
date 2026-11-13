"use client";

import Link from "next/link";
import { useDjSet } from "@/context/DjSetContext";
import { MusicArchiveShell } from "@/components/music/MusicArchiveShell";

export type DjArchiveTrack = {
  id: string;
  title: string;
  artist_name: string | null;
  cover_url: string | null;
  audio_url: string;
  duration: number | null;
  sort_order: number;
};

const display = "[font-family:var(--font-f-display),var(--font-f-sans),sans-serif]";

function clock(sec: number | null | undefined) {
  if (sec == null || !Number.isFinite(sec) || sec < 0) return "--:--";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/** E-06 — 재생은 상단 DJ SET 바 (하단 MusicPlayer 아님) */
export function DjSetArchiveClient({ tracks }: { tracks: DjArchiveTrack[] }) {
  const {
    tracks: barTracks,
    playAt,
    current,
    isPlaying,
    pause,
    play,
    currentTime,
    duration,
    liveUrl,
    liveEnabled,
  } = useDjSet();

  /** 상단 바 큐 기준 인덱스 (아카이브와 정렬이 다를 수 있어 id로 매칭) */
  const handlePlay = (index: number) => {
    const track = tracks[index];
    if (!track) return;
    if (current?.id === track.id) {
      if (isPlaying) pause();
      else play();
      return;
    }
    const barIndex = barTracks.findIndex((t) => t.id === track.id);
    playAt(barIndex >= 0 ? barIndex : index);
  };

  const featuredIndex = Math.max(
    0,
    tracks.findIndex((t) => t.id === current?.id),
  );
  const featured = tracks[featuredIndex] ?? null;
  const featuredActive = Boolean(featured && current?.id === featured.id);
  const featuredPlaying = featuredActive && isPlaying;
  const progress =
    featuredActive && duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  const placeholderRows = Math.max(0, 4 - tracks.length);

  return (
    <MusicArchiveShell
      active="dj-set"
      crumb="DJ SET"
      title="DJ SET"
      titleStyle="display"
      sub="매주 행사 · 유튜브 채널 믹스 아카이브"
      count={`${String(tracks.length).padStart(2, "0")} SETS`}
    >
      {tracks.length === 0 || !featured ? (
        <p className="py-10 text-[13px] text-[#a8a49b]">등록된 DJ SET이 없습니다.</p>
      ) : (
        <>
          <section className="flex flex-col items-stretch gap-6 rounded-[12px] border border-[#262626] bg-[rgba(10,10,10,0.35)] p-5 backdrop-blur-[6px] md:flex-row md:items-center md:gap-9 md:p-7">
            <div className="relative aspect-[3/2] w-full shrink-0 overflow-hidden bg-[#151515] md:h-[280px] md:w-[420px] md:aspect-auto">
              {featured.cover_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={featured.cover_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <div
                  className={`${display} flex h-full items-center justify-center bg-[#fbc201] text-[56px] font-bold text-[#0a0a0a]`}
                >
                  KH
                </div>
              )}
            </div>

            <div className="flex min-w-0 flex-1 flex-col items-start gap-3.5">
              <div className="flex items-center gap-2">
                <span
                  className={`size-2 rounded-full bg-[#fbc201] ${featuredPlaying ? "animate-pulse" : ""}`}
                />
                <p className="font-mono text-[11px] font-medium tracking-[1.5px] text-[#fbc201]">
                  NOW ON THE DJ SET BAR
                </p>
              </div>
              <h2
                className={`${display} text-[28px] font-bold uppercase leading-[1.1] text-[#f4f1ea] md:text-[36px]`}
              >
                {featured.title}
              </h2>
              <p className={`${display} text-[16px] font-bold tracking-[1px] text-[#f4f1ea]`}>
                {featured.artist_name || "koreaharlem"}
              </p>
              <p className="whitespace-pre-wrap text-[11px] font-medium tracking-[0.5px] text-[#6e6b65]">
                {"[행사명 · 장소 입력 필요]   ·   [YYYY.MM.DD]   ·   [러닝타임]"}
              </p>

              <div className="flex w-full items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handlePlay(featuredIndex)}
                  aria-label={featuredPlaying ? "일시정지" : "DJ SET 재생"}
                  className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#f4f1ea] text-[#0a0a0a] transition hover:bg-[#fbc201]"
                >
                  {featuredPlaying ? (
                    <span aria-hidden className="flex gap-[3px]">
                      <span className="h-4 w-[3px] bg-current" />
                      <span className="h-4 w-[3px] bg-current" />
                    </span>
                  ) : (
                    <span
                      aria-hidden
                      className="ml-1 h-0 w-0 border-y-[8px] border-l-[14px] border-y-transparent border-l-current"
                    />
                  )}
                </button>
                <div className="h-[3px] w-[100px] shrink-0 overflow-hidden bg-[#3d3d3d] sm:w-[160px]">
                  <div className="h-full bg-[#f4f1ea]" style={{ width: `${progress}%` }} />
                </div>
                <p className="whitespace-nowrap font-mono text-[11px] font-medium text-[#a8a49b]">
                  {clock(featuredActive ? currentTime : 0)} /{" "}
                  {clock(featuredActive && duration > 0 ? duration : featured.duration)}
                </p>
              </div>

              <div className="flex flex-wrap gap-2.5">
                {liveEnabled && liveUrl ? (
                  <a
                    href={liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="border border-[#262626] px-4 py-[9px] text-[12px] font-medium text-[#f4f1ea] transition hover:border-[#a8a49b]"
                  >
                    YOUTUBE에서 보기 →
                  </a>
                ) : (
                  <span
                    aria-disabled
                    className="cursor-not-allowed border border-[#262626] px-4 py-[9px] text-[12px] font-medium text-[#f4f1ea]"
                  >
                    YOUTUBE에서 보기 →
                  </span>
                )}
                <Link
                  href="/sale"
                  className="border border-[#262626] px-4 py-[9px] text-[12px] font-medium text-[#f4f1ea] transition hover:border-[#a8a49b]"
                >
                  이 행사 티켓 →
                </Link>
              </div>
            </div>
          </section>

          <section className="flex w-full flex-col overflow-x-auto" aria-label="DJ SET 목록">
            <div className="min-w-[860px]">
              <div className="flex items-center gap-4 border-b border-[#f4f1ea] py-[7px] font-mono text-[10px] font-medium tracking-[0.5px] text-[#6e6b65]">
                <p className="w-12 shrink-0">NO</p>
                <p className="min-w-0 flex-1">SET</p>
                <p className="w-[200px] shrink-0">DJ</p>
                <p className="w-[220px] shrink-0">EVENT / PLACE</p>
                <p className="w-[110px] shrink-0">DATE</p>
                <p className="w-[70px] shrink-0">TIME</p>
                <p className="w-10 shrink-0" aria-hidden />
              </div>

              {tracks.map((track, index) => {
                const active = current?.id === track.id;
                const playing = active && isPlaying;
                return (
                  <button
                    key={track.id}
                    type="button"
                    onClick={() => handlePlay(index)}
                    aria-label={`${track.title} ${playing ? "일시정지" : "재생"}`}
                    className={`group flex w-full items-center gap-4 border-b border-[#262626] text-left tracking-[0.5px] transition-colors hover:bg-[rgba(244,241,234,0.03)] ${
                      active ? "py-[7px]" : "py-2"
                    }`}
                  >
                    <span
                      className={`w-12 shrink-0 font-mono text-[12px] font-medium ${
                        active ? "text-[#fbc201]" : "text-[#6e6b65]"
                      }`}
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span
                      className={`min-w-0 flex-1 truncate text-[15px] ${
                        active
                          ? `${display} font-bold uppercase text-[#f4f1ea]`
                          : "font-medium text-[#a8a49b] group-hover:text-[#f4f1ea]"
                      }`}
                    >
                      {track.title}
                    </span>
                    <span
                      className={`w-[200px] shrink-0 truncate text-[13px] ${
                        active
                          ? `${display} font-bold uppercase text-[#f4f1ea]`
                          : "font-medium text-[#6e6b65]"
                      }`}
                    >
                      {track.artist_name || "koreaharlem"}
                    </span>
                    <span className="w-[220px] shrink-0 text-[12px] text-[#6e6b65]">
                      {active ? "[입력 필요]" : "[행사 · 장소]"}
                    </span>
                    <span
                      className={`w-[110px] shrink-0 text-[11px] text-[#6e6b65] ${
                        active ? "font-medium" : "font-mono font-medium"
                      }`}
                    >
                      {active ? "[입력 필요]" : "YYYY.MM.DD"}
                    </span>
                    <span className="w-[70px] shrink-0 font-mono text-[11px] font-medium text-[#6e6b65]">
                      {clock(track.duration)}
                    </span>
                    <span className="flex w-10 shrink-0 items-center text-[#fbc201]" aria-hidden>
                      {playing ? (
                        <span className="size-[9px] bg-[#fbc201]" />
                      ) : active ? (
                        <span className="size-[9px] bg-[#fbc201]/60" />
                      ) : (
                        <span className="ml-px h-0 w-0 border-y-[5px] border-l-[9px] border-y-transparent border-l-[#6e6b65] group-hover:border-l-[#f4f1ea]" />
                      )}
                    </span>
                  </button>
                );
              })}

              {Array.from({ length: placeholderRows }).map((_, i) => (
                <div
                  key={`ph-${i}`}
                  aria-hidden
                  className="flex items-center gap-4 border-b border-[#262626] py-2 tracking-[0.5px] text-[#6e6b65]"
                >
                  <span className="w-12 shrink-0 font-mono text-[12px] font-medium">
                    {String(tracks.length + i + 1).padStart(2, "0")}
                  </span>
                  <span className="min-w-0 flex-1 text-[15px] font-medium">[DJ SET 제목]</span>
                  <span className="w-[200px] shrink-0 text-[13px] font-medium">[DJ]</span>
                  <span className="w-[220px] shrink-0 text-[12px]">[행사 · 장소]</span>
                  <span className="w-[110px] shrink-0 font-mono text-[11px] font-medium">
                    YYYY.MM.DD
                  </span>
                  <span className="w-[70px] shrink-0 font-mono text-[11px] font-medium">--:--</span>
                  <span className="ml-px h-0 w-0 border-y-[5px] border-l-[9px] border-y-transparent border-l-[#6e6b65]" />
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      <p className="text-[12px] text-[#6e6b65]">
        ※ 사이트 첫 진입 시 상단 DJ SET 바에서 관리자가 지정한 믹스가 재생 · 다른 곡을 누르면 DJ SET은 멈추고 하단 플레이어가 열림 (9/15 합의)
      </p>
    </MusicArchiveShell>
  );
}
