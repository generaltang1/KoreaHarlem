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

interface ArtistOption {
  id: string;
  name: string;
}

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
  const [artistId, setArtistId] = useState("");
  const [description, setDescription] = useState("");
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

    const selectedArtist = artists.find((a) => a.id === artistId);
    if (!selectedArtist) {
      setError("아티스트를 선택해주세요. 아티스트 등록이 먼저 필요합니다.");
      return;
    }

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
          artist_id: selectedArtist.id,
          artist_name: selectedArtist.name,
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

  return (
    <div>
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted">Admin</p>
          <h1 className="mt-1 text-xl font-medium uppercase tracking-wider">앨범 등록</h1>
          <p className="mt-2 text-xs text-muted">아티스트 등록 → 아티스트 선택 → 앨범/수록곡 등록</p>
        </div>
        <Link href="/admin/music" className="text-[10px] uppercase tracking-widest text-muted underline">
          목록으로
        </Link>
      </div>

      {!artistsLoading && artists.length === 0 && (
        <div className="mb-6 border border-border p-5">
          <p className="text-sm">등록된 아티스트가 없습니다.</p>
          <p className="mt-1 text-xs text-muted">음악을 올리려면 아티스트를 먼저 등록해야 합니다.</p>
          <Link
            href="/admin/artists"
            className="mt-4 inline-block text-xs uppercase tracking-widest underline"
          >
            아티스트 관리하러 가기 →
          </Link>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="mb-1.5 block text-[10px] uppercase tracking-widest text-muted">아티스트 *</label>
          <select
            value={artistId}
            onChange={(e) => setArtistId(e.target.value)}
            required
            disabled={artists.length === 0}
            className="w-full border border-border bg-background px-4 py-3 text-sm outline-none focus:border-foreground disabled:opacity-50"
          >
            <option value="">{artistsLoading ? "불러오는 중..." : "아티스트 선택"}</option>
            {artists.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-[10px] uppercase tracking-widest text-muted">앨범 제목 *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full border border-border bg-transparent px-4 py-3 text-sm outline-none focus:border-foreground"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-[10px] uppercase tracking-widest text-muted">앨범 유형</label>
            <select
              value={albumType}
              onChange={(e) => setAlbumType(e.target.value as AlbumType | "")}
              className="w-full border border-border bg-background px-4 py-3 text-sm outline-none focus:border-foreground"
            >
              {ALBUM_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-[10px] uppercase tracking-widest text-muted">발매일</label>
            <input
              type="date"
              value={releaseDate}
              onChange={(e) => setReleaseDate(e.target.value)}
              className="w-full border border-border bg-transparent px-4 py-3 text-sm outline-none focus:border-foreground"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-[10px] uppercase tracking-widest text-muted">공개 설정</label>
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
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              required
              className="mt-3 w-full border border-border bg-transparent px-4 py-3 text-sm outline-none focus:border-foreground"
            />
          ) : null}
        </div>

        <div>
          <label className="mb-1.5 block text-[10px] uppercase tracking-widest text-muted">
            디지털 앨범 판매가 (KRW)
          </label>
          <input
            type="number"
            min={0}
            value={digitalPrice}
            onChange={(e) => setDigitalPrice(e.target.value)}
            placeholder="비워두면 판매 안 함 · 스트리밍은 무료"
            className="w-full border border-border bg-transparent px-4 py-3 text-sm outline-none focus:border-foreground"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-[10px] uppercase tracking-widest text-muted">앨범 설명</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full resize-none border border-border bg-transparent px-4 py-3 text-sm outline-none focus:border-foreground"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-[10px] uppercase tracking-widest text-muted">앨범 커버</label>
          <input type="file" accept="image/*" onChange={handleCover} className="w-full border border-border px-4 py-3 text-sm" />
          {coverPreview && (
            <div className="mt-4 space-y-3">
              <div className="relative h-48 w-48 overflow-hidden border border-border bg-black">
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
              <input type="range" min="1" max="3" step="0.01" value={coverZoom} onChange={(e) => setCoverZoom(Number(e.target.value))} className="w-full" />
              <input type="range" min="-100" max="100" step="1" value={coverOffsetX} onChange={(e) => setCoverOffsetX(Number(e.target.value))} className="w-full" />
              <input type="range" min="-100" max="100" step="1" value={coverOffsetY} onChange={(e) => setCoverOffsetY(Number(e.target.value))} className="w-full" />
            </div>
          )}
        </div>

        <div className="space-y-4 border-t border-border pt-6">
          <div className="flex items-center justify-between">
            <p className="text-[10px] uppercase tracking-widest text-muted">수록곡</p>
            <button
              type="button"
              onClick={addTrackRow}
              className="border border-border px-3 py-1.5 text-[10px] uppercase tracking-widest hover:border-foreground"
            >
              + 수록곡 추가
            </button>
          </div>

          {tracks.map((row, index) => (
            <div key={row.key} className="space-y-3 border border-border p-4">
              <div className="flex items-center justify-between gap-4">
                <p className="text-xs font-medium">수록곡 {index + 1}</p>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => toggleTitleTrack(row.key)}
                    className={`border px-3 py-1.5 text-[10px] uppercase tracking-widest transition-colors ${
                      row.isTitleTrack
                        ? "border-foreground bg-foreground text-background"
                        : "border-border text-muted hover:border-foreground hover:text-foreground"
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
                className="w-full border border-border bg-transparent px-4 py-3 text-sm outline-none focus:border-foreground"
              />
              <label className="block text-[10px] uppercase tracking-widest text-muted">스트리밍/MP3 *</label>
              <input
                type="file"
                accept="audio/*"
                onChange={(e) => updateTrack(row.key, { audioFile: e.target.files?.[0] ?? null })}
                className="w-full border border-border px-4 py-3 text-sm"
              />
              <input
                type="number"
                min={0}
                placeholder="트랙 디지털 판매가 (비워두면 미판매)"
                value={row.digitalPrice}
                onChange={(e) => updateTrack(row.key, { digitalPrice: e.target.value })}
                className="w-full border border-border bg-transparent px-4 py-3 text-sm outline-none focus:border-foreground"
              />
              <label className="block text-[10px] uppercase tracking-widest text-muted">WAV 원본 (구매 다운로드용, 선택)</label>
              <input
                type="file"
                accept="audio/wav,audio/x-wav,.wav"
                onChange={(e) => updateTrack(row.key, { wavFile: e.target.files?.[0] ?? null })}
                className="w-full border border-border px-4 py-3 text-sm"
              />
              <textarea
                placeholder="곡 설명 (선택)"
                value={row.description}
                onChange={(e) => updateTrack(row.key, { description: e.target.value })}
                rows={8}
                className="min-h-[200px] w-full resize-y border border-border bg-transparent px-4 py-3 text-sm leading-relaxed outline-none focus:border-foreground"
              />
            </div>
          ))}
        </div>

        {error && <p className="text-xs text-rose-500">{error}</p>}

        <button
          type="submit"
          disabled={loading || artists.length === 0}
          className="w-full bg-foreground py-3 text-xs uppercase tracking-widest text-background disabled:opacity-50"
        >
          {loading ? "등록 중..." : "앨범 등록"}
        </button>
      </form>
    </div>
  );
}
