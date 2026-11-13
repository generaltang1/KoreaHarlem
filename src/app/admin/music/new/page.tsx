"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ALBUM_TYPE_OPTIONS,
  resolvePublishFields,
  type AlbumPublishMode,
  type AlbumType,
} from "@/lib/albumPublish";
import { writeAdminAudit } from "@/lib/adminAudit";
import { createClient } from "@/lib/supabase/client";
import { loadDurationFromFile } from "@/lib/audioDuration";
import { buildCroppedCover } from "@/lib/image/cropCover";
import { ArtistMultiSelect, type ArtistOption } from "@/components/admin/ArtistMultiSelect";
import { adminLight as admin } from "@/lib/siteTheme";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

interface TrackFormRow {
  key: string;
  title: string;
  description: string;
  audioFile: File | null;
  wavFile: File | null;
  digitalPrice: string;
  isTitleTrack: boolean;
}

function newTrackRow(): TrackFormRow {
  return {
    key: crypto.randomUUID(),
    title: "",
    description: "",
    audioFile: null,
    wavFile: null,
    digitalPrice: "",
    isTitleTrack: false,
  };
}

function parsePrice(value: string): number | null {
  const n = Number(value.replace(/,/g, "").trim());
  if (!value.trim() || !Number.isFinite(n) || n <= 0) return null;
  return Math.round(n);
}

export default function NewAlbumPage() {
  const router = useRouter();
  const supabase = createClient();

  const [artists, setArtists] = useState<ArtistOption[]>([]);
  const [artistsLoading, setArtistsLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [artistIds, setArtistIds] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewAudio, setPreviewAudio] = useState<HTMLAudioElement | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverZoom, setCoverZoom] = useState(1);
  const [coverOffsetX, setCoverOffsetX] = useState(0);
  const [coverOffsetY, setCoverOffsetY] = useState(0);
  const [digitalPrice, setDigitalPrice] = useState("");
  const [albumType, setAlbumType] = useState<AlbumType | "">("album");
  const [releaseDate, setReleaseDate] = useState("");
  const [publishMode, setPublishMode] = useState<AlbumPublishMode>("public");
  const [scheduledAt, setScheduledAt] = useState("");
  const [tracks, setTracks] = useState<TrackFormRow[]>([newTrackRow()]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase
      .from("artists")
      .select("id, name")
      .order("name")
      .then(({ data }) => {
        setArtists(data ?? []);
        setArtistsLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCover = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setCoverFile(file);
    setCoverZoom(1);
    setCoverOffsetX(0);
    setCoverOffsetY(0);
    if (file) setCoverPreview(URL.createObjectURL(file));
  };

  const updateTrack = (key: string, patch: Partial<TrackFormRow>) => {
    setTracks((prev) => prev.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  };

  const toggleTitleTrack = (key: string) => {
    setTracks((prev) =>
      prev.map((row) =>
        row.key === key ? { ...row, isTitleTrack: !row.isTitleTrack } : row,
      ),
    );
  };

  const addTrackRow = () => setTracks((prev) => [...prev, newTrackRow()]);

  const removeTrackRow = (key: string) => {
    setTracks((prev) => (prev.length <= 1 ? prev : prev.filter((row) => row.key !== key)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const selectedArtists = artists.filter((a) => artistIds.includes(a.id));
    if (selectedArtists.length === 0) {
      setError("아티스트를 1명 이상 선택해주세요. 아티스트 등록이 먼저 필요합니다.");
      return;
    }
    const primaryArtist = selectedArtists[0];
    const artistNameJoined = selectedArtists.map((a) => a.name).join(", ");

    const validTracks = tracks.filter((row) => row.title.trim() && row.audioFile);
    if (validTracks.length === 0) {
      setError("수록곡 1개 이상(제목 + 음원 파일)을 등록해주세요.");
      return;
    }

    if (publishMode === "scheduled" && !scheduledAt) {
      setError("예약 공개 일시를 입력해주세요.");
      return;
    }

    setLoading(true);

    try {
      let cover_url: string | null = null;
      if (coverFile) {
        const cropped = await buildCroppedCover(coverFile, coverZoom, coverOffsetX, coverOffsetY);
        const coverPath = `covers/${Date.now()}.jpg`;
        const { error: coverErr } = await supabase.storage.from("images").upload(coverPath, cropped);
        if (coverErr) throw coverErr;
        const { data: coverUrlData } = supabase.storage.from("images").getPublicUrl(coverPath);
        cover_url = coverUrlData.publicUrl;
      }

      const publish = resolvePublishFields(publishMode, scheduledAt);

      const { data: album, error: albumErr } = await supabase
        .from("albums")
        .insert({
          title,
          artist_id: primaryArtist.id,
          artist_name: artistNameJoined,
          description: description.trim() || null,
          cover_url,
          digital_price_krw: parsePrice(digitalPrice),
          album_type: albumType || null,
          release_date: releaseDate || null,
          is_published: publish.is_published,
          scheduled_publish_at: publish.scheduled_publish_at,
        })
        .select("id")
        .single();
      if (albumErr || !album) throw albumErr ?? new Error("앨범 생성 실패");

      await writeAdminAudit({
        module: "music",
        action: "create",
        targetType: "album",
        targetId: album.id,
        summary: `앨범 등록: ${title}`,
        meta: {
          album_type: albumType || null,
          publish_mode: publishMode,
          is_published: publish.is_published,
        },
      });

      for (let i = 0; i < validTracks.length; i++) {
        const row = validTracks[i];
        const audioFile = row.audioFile!;
        const audioExt = audioFile.name.split(".").pop();
        const audioPath = `tracks/${album.id}/${Date.now()}-${i}.${audioExt}`;
        const { error: audioErr } = await supabase.storage.from("audio").upload(audioPath, audioFile);
        if (audioErr) throw audioErr;
        const { data: audioUrlData } = supabase.storage.from("audio").getPublicUrl(audioPath);
        const duration = await loadDurationFromFile(audioFile);

        let download_wav_url: string | null = null;
        if (row.wavFile) {
          const wavPath = `tracks/${album.id}/${Date.now()}-${i}-wav.wav`;
          const { error: wavErr } = await supabase.storage.from("audio").upload(wavPath, row.wavFile);
          if (wavErr) throw wavErr;
          download_wav_url = supabase.storage.from("audio").getPublicUrl(wavPath).data.publicUrl;
        }

        const { error: trackErr } = await supabase.from("album_tracks").insert({
          album_id: album.id,
          track_order: i + 1,
          title: row.title.trim(),
          description: row.description.trim() || null,
          audio_url: audioUrlData.publicUrl,
          duration,
          is_title_track: row.isTitleTrack,
          digital_price_krw: parsePrice(row.digitalPrice),
          download_mp3_url: audioUrlData.publicUrl,
          download_wav_url,
        });
        if (trackErr) throw trackErr;
      }

      router.push("/admin/music");
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "등록 중 오류가 발생했습니다.";
      if (/digital_price|download_wav|download_mp3/i.test(message)) {
        setError(
          "디지털 판매 컬럼이 없습니다. Supabase SQL Editor에서 supabase/add_music_digital_sales.sql 을 실행해주세요.",
        );
      } else if (/album_type|scheduled_publish|is_published|release_date/i.test(message)) {
        setError(
          "앨범 공개/유형 컬럼이 없습니다. Supabase SQL Editor에서 supabase/add_admin_dashboard_phase2.sql 을 실행해주세요.",
        );
      } else if (/artist_id|column/i.test(message)) {
        setError(
          "DB에 artist_id 컬럼이 없습니다. Supabase SQL Editor에서 supabase/add_albums_artist_id.sql 을 실행해주세요.",
        );
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const stopPreview = () => {
    previewAudio?.pause();
    setPreviewAudio(null);
    setPreviewUrl(null);
  };

  const playPreviewFile = async (file: File | null) => {
    if (!file) return;
    stopPreview();
    // 하단/상단 플레이어와 무관 — 등록 확인용. 기존 재생은 멈춤.
    const { notifyMusicTakeover, notifyDjTakeover } = await import("@/lib/playbackFocus");
    notifyMusicTakeover();
    notifyDjTakeover();
    const url = URL.createObjectURL(file);
    const audio = new Audio(url);
    audio.onended = () => {
      URL.revokeObjectURL(url);
      setPreviewAudio(null);
      setPreviewUrl(null);
    };
    setPreviewAudio(audio);
    setPreviewUrl(url);
    void audio.play().catch(() => stopPreview());
  };

  return (
    <div className={admin.page}>
      <AdminPageHeader
        eyebrow="E-08 · H-xx Admin"
        title="앨범 등록"
        description="시안 경로 /admin/music/albums/new · 입력 시 Music·앨범·아티스트 공개면에 반영됩니다."
        actions={
          <Link href="/admin/music" className={admin.btnGhost}>
            목록
          </Link>
        }
      />

      <div className={`${admin.cardPad} mb-6 border-dashed`}>
        <p className={`text-xs font-semibold uppercase tracking-widest ${admin.muted}`}>시안 대기 필드</p>
        <p className={`mt-2 text-sm ${admin.muted}`}>
          LP/카세트 SKU · Supported by · 장르 해시태그 · 암시장(머천) 연동 · 카탈로그 번호 — DB/정책 확정 후
          이어서 붙입니다. 아래는 동작하는 핵심 등록 흐름입니다.
        </p>
      </div>

      {!artistsLoading && artists.length === 0 && (
        <div className={`${admin.cardPad} mb-6`}>
          <p className="text-sm">등록된 아티스트가 없습니다.</p>
          <p className={`mt-1 text-xs ${admin.muted}`}>음악을 올리려면 아티스트를 먼저 등록해야 합니다.</p>
          <Link href="/admin/artists/new" className={`${admin.link} mt-4 inline-block text-xs uppercase tracking-widest`}>
            아티스트 등록 →
          </Link>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className={`${admin.cardPad} space-y-5`}>
          <h2 className="text-sm font-bold tracking-tight">01 · 기본 정보</h2>
          <div>
            <label className={admin.label}>아티스트 * (검색 · 다중 선택)</label>
            <ArtistMultiSelect
              artists={artists}
              selectedIds={artistIds}
              onChange={setArtistIds}
              loading={artistsLoading}
            />
          </div>
          <div>
            <label className={admin.label}>앨범 제목 *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className={admin.input}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={admin.label}>앨범 유형</label>
              <select
                value={albumType}
                onChange={(e) => setAlbumType(e.target.value as AlbumType | "")}
                className={admin.input}
              >
                {ALBUM_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={admin.label}>발매일</label>
              <input
                type="date"
                value={releaseDate}
                onChange={(e) => setReleaseDate(e.target.value)}
                className={admin.input}
              />
            </div>
          </div>
          <div>
            <label className={admin.label}>공개 설정</label>
            <div className="flex flex-wrap gap-4 text-sm">
              {(
                [
                  { value: "public", label: "공개 즉시" },
                  { value: "scheduled", label: "예약 공개" },
                  { value: "private", label: "비공개" },
                ] as const
              ).map((opt) => (
                <label key={opt.value} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="publishMode"
                    checked={publishMode === opt.value}
                    onChange={() => setPublishMode(opt.value)}
                  />
                  {opt.label}
                </label>
              ))}
            </div>
            {publishMode === "scheduled" ? (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <label className={admin.label}>예약 날짜</label>
                  <input
                    type="date"
                    value={scheduledAt.slice(0, 10)}
                    onChange={(e) => {
                      const time = scheduledAt.includes("T") ? scheduledAt.slice(11, 16) : "12:00";
                      setScheduledAt(`${e.target.value}T${time}`);
                    }}
                    required
                    className={admin.input}
                  />
                </div>
                <div>
                  <label className={admin.label}>예약 시간</label>
                  <input
                    type="time"
                    value={scheduledAt.includes("T") ? scheduledAt.slice(11, 16) : ""}
                    onChange={(e) => {
                      const day = scheduledAt.slice(0, 10) || new Date().toISOString().slice(0, 10);
                      setScheduledAt(`${day}T${e.target.value}`);
                    }}
                    required
                    className={admin.input}
                  />
                </div>
                <p className={`sm:col-span-2 text-xs ${admin.muted}`}>
                  해당 시각이 되면 공개 앨범으로 전환되어 Music / 앨범 상세에 노출됩니다.
                </p>
              </div>
            ) : null}
          </div>
          <div>
            <label className={admin.label}>디지털 앨범 판매가 (KRW)</label>
            <input
              type="number"
              min={0}
              value={digitalPrice}
              onChange={(e) => setDigitalPrice(e.target.value)}
              placeholder="비워두면 판매 안 함 · 스트리밍은 무료"
              className={admin.input}
            />
          </div>
          <div>
            <label className={admin.label}>앨범 설명</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className={`${admin.input} min-h-[100px] resize-y`}
            />
          </div>
        </section>

        <section className={`${admin.cardPad} space-y-4`}>
          <h2 className="text-sm font-bold tracking-tight">02 · 커버</h2>
          <input type="file" accept="image/*" onChange={handleCover} className={admin.input} />
          {coverPreview && (
            <div className="space-y-3">
              <div className="relative h-48 w-48 overflow-hidden rounded-[8px] border border-[#e5e7eb] bg-black">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={coverPreview}
                  alt="커버 미리보기"
                  className="h-full w-full object-cover"
                  style={{
                    transform: `scale(${coverZoom}) translate(${coverOffsetX}%, ${coverOffsetY}%)`,
                    transformOrigin: "center",
                  }}
                />
              </div>
              <label className={admin.label}>줌</label>
              <input type="range" min="1" max="3" step="0.01" value={coverZoom} onChange={(e) => setCoverZoom(Number(e.target.value))} className="w-full" />
              <label className={admin.label}>가로</label>
              <input type="range" min="-100" max="100" step="1" value={coverOffsetX} onChange={(e) => setCoverOffsetX(Number(e.target.value))} className="w-full" />
              <label className={admin.label}>세로</label>
              <input type="range" min="-100" max="100" step="1" value={coverOffsetY} onChange={(e) => setCoverOffsetY(Number(e.target.value))} className="w-full" />
            </div>
          )}
        </section>

        <section className={`${admin.cardPad} space-y-4`}>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold tracking-tight">03 · 수록곡</h2>
            <button type="button" onClick={addTrackRow} className={admin.btnGhost}>
              + 행 추가
            </button>
          </div>
          <p className={`text-xs ${admin.muted}`}>
            행 추가/삭제 · 미리듣기 · Title 표시 · 예약 발행은 위 공개 설정과 함께 동작합니다.
          </p>

          {tracks.map((row, index) => (
            <div key={row.key} className="space-y-3 rounded-[8px] border border-[#e5e7eb] bg-white p-4">
              <div className="flex items-center justify-between gap-4">
                <p className="text-xs font-semibold">트랙 {String(index + 1).padStart(2, "0")}</p>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => toggleTitleTrack(row.key)}
                    className={`rounded-[6px] border px-3 py-1.5 text-[10px] uppercase tracking-widest transition-colors ${
                      row.isTitleTrack
                        ? "border-[#111] bg-[#111] text-white"
                        : "border-[#e5e7eb] text-[#6b7280] hover:border-[#111]"
                    }`}
                  >
                    Title
                  </button>
                  {tracks.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTrackRow(row.key)}
                      className="text-[10px] uppercase tracking-widest text-rose-500"
                    >
                      삭제
                    </button>
                  )}
                </div>
              </div>
              <input
                type="text"
                placeholder="곡 제목 *"
                value={row.title}
                onChange={(e) => updateTrack(row.key, { title: e.target.value })}
                className={admin.input}
              />
              <label className={admin.label}>음원 첨부 * (스트리밍/MP3)</label>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="file"
                  accept="audio/*"
                  onChange={(e) => updateTrack(row.key, { audioFile: e.target.files?.[0] ?? null })}
                  className={`min-w-0 flex-1 ${admin.input}`}
                />
                <button
                  type="button"
                  className={admin.btnGhost}
                  disabled={!row.audioFile}
                  onClick={() => void playPreviewFile(row.audioFile)}
                >
                  {previewUrl && row.audioFile ? "미리듣기 중" : "미리듣기"}
                </button>
                {previewAudio && (
                  <button type="button" className={admin.btnGhost} onClick={stopPreview}>
                    STOP
                  </button>
                )}
              </div>
              <p className={`text-[10px] ${admin.muted}`}>
                길이는 첨부 파일에서 자동 측정됩니다. 미리듣기는 등록 확인용이며 다른 재생을 멈춥니다.
              </p>
              <label className={admin.label}>WAV (선택 · My Music ZIP)</label>
              <input
                type="file"
                accept="audio/wav,audio/x-wav,.wav"
                onChange={(e) => updateTrack(row.key, { wavFile: e.target.files?.[0] ?? null })}
                className={admin.input}
              />
              <textarea
                placeholder="곡 설명 (선택)"
                value={row.description}
                onChange={(e) => updateTrack(row.key, { description: e.target.value })}
                rows={4}
                className={`${admin.input} min-h-[120px] resize-y`}
              />
            </div>
          ))}
        </section>

        {error && <p className="text-xs text-rose-500">{error}</p>}

        <button
          type="submit"
          disabled={loading || artists.length === 0}
          className={`${admin.btnPrimary} w-full disabled:opacity-50`}
        >
          {loading ? "등록 중..." : "앨범 등록"}
        </button>
      </form>
    </div>
  );
}
