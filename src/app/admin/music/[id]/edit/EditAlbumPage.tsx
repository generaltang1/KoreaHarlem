"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { loadDurationFromFile, loadDurationFromUrl } from "@/lib/audioDuration";
import { buildCroppedCover } from "@/lib/image/cropCover";

interface EditAlbumPageProps {
  albumId: string;
}

interface ArtistOption {
  id: string;
  name: string;
}

interface TrackEditRow {
  key: string;
  id?: string;
  title: string;
  description: string;
  audio_url?: string;
  duration?: number | null;
  audioFile: File | null;
  wavFile: File | null;
  download_wav_url?: string | null;
  digitalPrice: string;
  removed: boolean;
  isTitleTrack: boolean;
}

function newTrackRow(): TrackEditRow {
  return {
    key: crypto.randomUUID(),
    title: "",
    description: "",
    audioFile: null,
    wavFile: null,
    digitalPrice: "",
    removed: false,
    isTitleTrack: false,
  };
}

function parsePrice(value: string): number | null {
  const n = Number(value.replace(/,/g, "").trim());
  if (!value.trim() || !Number.isFinite(n) || n <= 0) return null;
  return Math.round(n);
}

export default function EditAlbumPage({ albumId }: EditAlbumPageProps) {
  const router = useRouter();
  const supabase = createClient();

  const [artists, setArtists] = useState<ArtistOption[]>([]);
  const [title, setTitle] = useState("");
  const [artistId, setArtistId] = useState("");
  const [description, setDescription] = useState("");
  const [currentCoverUrl, setCurrentCoverUrl] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverZoom, setCoverZoom] = useState(1);
  const [coverOffsetX, setCoverOffsetX] = useState(0);
  const [coverOffsetY, setCoverOffsetY] = useState(0);
  const [digitalPrice, setDigitalPrice] = useState("");
  const [tracks, setTracks] = useState<TrackEditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");

      const { data: artistRows } = await supabase.from("artists").select("id, name").order("name");
      let { data, error: fetchError } = await supabase
        .from("albums")
        .select("title, artist_id, artist_name, description, cover_url, digital_price_krw, album_tracks(*)")
        .eq("id", albumId)
        .single();

      if (fetchError && /digital_price/i.test(fetchError.message)) {
        const retry = await supabase
          .from("albums")
          .select("title, artist_id, artist_name, description, cover_url, album_tracks(*)")
          .eq("id", albumId)
          .single();
        data = retry.data as typeof data;
        fetchError = retry.error;
      }

      const artistList = artistRows ?? [];
      setArtists(artistList);

      if (fetchError || !data) {
        setError("앨범 정보를 불러오지 못했습니다.");
        setLoading(false);
        return;
      }

      setTitle(data.title);
      setDescription(data.description ?? "");
      setDigitalPrice(data.digital_price_krw ? String(data.digital_price_krw) : "");
      setCurrentCoverUrl(data.cover_url);
      setCoverPreview(data.cover_url);

      const linkedId =
        data.artist_id ||
        artistList.find((a) => a.name === data.artist_name)?.id ||
        "";
      setArtistId(linkedId);

      const sorted = [...(data.album_tracks ?? [])].sort(
        (a, b) => a.track_order - b.track_order,
      );
      setTracks(
        sorted.map((track) => ({
          key: track.id,
          id: track.id,
          title: track.title,
          description: track.description ?? "",
          audio_url: track.audio_url,
          duration: track.duration ?? null,
          audioFile: null,
          wavFile: null,
          download_wav_url: track.download_wav_url ?? null,
          digitalPrice: track.digital_price_krw ? String(track.digital_price_krw) : "",
          removed: false,
          isTitleTrack: track.is_title_track ?? false,
        })),
      );
      setLoading(false);
    };

    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [albumId]);

  const handleCover = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setCoverFile(file);
    setCoverZoom(1);
    setCoverOffsetX(0);
    setCoverOffsetY(0);
    if (file) setCoverPreview(URL.createObjectURL(file));
  };

  const updateTrack = (key: string, patch: Partial<TrackEditRow>) => {
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
    setTracks((prev) =>
      prev.map((row) => (row.key === key ? { ...row, removed: true } : row)),
    );
  };

  const activeTracks = tracks.filter((row) => !row.removed);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const selectedArtist = artists.find((a) => a.id === artistId);
    if (!selectedArtist) {
      setError("아티스트를 선택해주세요.");
      return;
    }

    const validTracks = activeTracks.filter(
      (row) => row.title.trim() && (row.audioFile || row.audio_url),
    );
    if (validTracks.length === 0) {
      setError("수록곡 1개 이상(제목 + 음원)이 필요합니다.");
      return;
    }

    setSaving(true);

    try {
      const albumUpdate: {
        title: string;
        artist_id: string;
        artist_name: string;
        description: string | null;
        cover_url?: string | null;
        digital_price_krw: number | null;
      } = {
        title,
        artist_id: selectedArtist.id,
        artist_name: selectedArtist.name,
        description: description.trim() || null,
        digital_price_krw: parsePrice(digitalPrice),
      };

      if (coverFile) {
        const cropped = await buildCroppedCover(coverFile, coverZoom, coverOffsetX, coverOffsetY);
        const coverPath = `covers/${Date.now()}.jpg`;
        const { error: coverErr } = await supabase.storage.from("images").upload(coverPath, cropped);
        if (coverErr) throw coverErr;
        const { data: coverUrlData } = supabase.storage.from("images").getPublicUrl(coverPath);
        albumUpdate.cover_url = coverUrlData.publicUrl;
      }

      const { error: albumErr } = await supabase
        .from("albums")
        .update(albumUpdate)
        .eq("id", albumId);
      if (albumErr) throw albumErr;

      const removedWithId = tracks.filter((row) => row.removed && row.id);
      for (const row of removedWithId) {
        const { error: deleteErr } = await supabase
          .from("album_tracks")
          .delete()
          .eq("id", row.id!);
        if (deleteErr) throw deleteErr;
      }

      for (let i = 0; i < validTracks.length; i++) {
        const row = validTracks[i];
        let audio_url = row.audio_url;
        let duration: number | null | undefined = undefined;

        if (row.audioFile) {
          const audioExt = row.audioFile.name.split(".").pop();
          const audioPath = `tracks/${albumId}/${Date.now()}-${i}.${audioExt}`;
          const { error: audioErr } = await supabase.storage
            .from("audio")
            .upload(audioPath, row.audioFile);
          if (audioErr) throw audioErr;
          const { data: audioUrlData } = supabase.storage.from("audio").getPublicUrl(audioPath);
          audio_url = audioUrlData.publicUrl;
          duration = await loadDurationFromFile(row.audioFile);
        } else if (audio_url && !row.duration) {
          duration = await loadDurationFromUrl(audio_url);
        }

        let download_wav_url = row.download_wav_url ?? null;
        if (row.wavFile) {
          const wavPath = `tracks/${albumId}/${Date.now()}-${i}-wav.wav`;
          const { error: wavErr } = await supabase.storage.from("audio").upload(wavPath, row.wavFile);
          if (wavErr) throw wavErr;
          download_wav_url = supabase.storage.from("audio").getPublicUrl(wavPath).data.publicUrl;
        }

        const digitalPayload = {
          digital_price_krw: parsePrice(row.digitalPrice),
          download_mp3_url: audio_url ?? null,
          download_wav_url,
        };

        if (row.id) {
          const { error: updateErr } = await supabase
            .from("album_tracks")
            .update({
              track_order: i + 1,
              title: row.title.trim(),
              description: row.description.trim() || null,
              audio_url: audio_url!,
              ...(duration != null ? { duration } : {}),
              is_title_track: row.isTitleTrack,
              ...digitalPayload,
            })
            .eq("id", row.id);
          if (updateErr) throw updateErr;
        } else {
          const { error: insertErr } = await supabase.from("album_tracks").insert({
            album_id: albumId,
            track_order: i + 1,
            title: row.title.trim(),
            description: row.description.trim() || null,
            audio_url: audio_url!,
            duration: duration ?? null,
            is_title_track: row.isTitleTrack,
            ...digitalPayload,
          });
          if (insertErr) throw insertErr;
        }
      }

      router.push("/admin/music");
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "수정 중 오류가 발생했습니다.";
      if (/digital_price|download_wav|download_mp3/i.test(message)) {
        setError(
          "디지털 판매 컬럼이 없습니다. Supabase SQL Editor에서 supabase/add_music_digital_sales.sql 을 실행해주세요.",
        );
      } else if (/artist_id|column/i.test(message)) {
        setError(
          "DB에 artist_id 컬럼이 없습니다. Supabase SQL Editor에서 supabase/add_albums_artist_id.sql 을 실행해주세요.",
        );
      } else {
        setError(message);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAlbum = async () => {
    if (!confirm(`"${title}" 앨범을 삭제할까요?`)) return;

    setSaving(true);
    setError("");

    const { error: deleteError } = await supabase.from("albums").delete().eq("id", albumId);
    setSaving(false);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    router.push("/admin/music");
    router.refresh();
  };

  if (loading) {
    return <p className="text-sm text-muted">불러오는 중...</p>;
  }

  return (
    <div>
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted">Admin</p>
          <h1 className="mt-1 text-xl font-medium uppercase tracking-wider">앨범 수정</h1>
        </div>
        <Link href="/admin/music" className="text-[10px] uppercase tracking-widest text-muted underline">
          목록으로
        </Link>
      </div>

      {artists.length === 0 && (
        <div className="mb-6 border border-border p-5">
          <p className="text-sm">등록된 아티스트가 없습니다.</p>
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
            <option value="">아티스트 선택</option>
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
          <label className="mb-1.5 block text-[10px] uppercase tracking-widest text-muted">앨범 커버 (변경 시에만 선택)</label>
          <input type="file" accept="image/*" onChange={handleCover} className="w-full border border-border px-4 py-3 text-sm" />
          {coverPreview && (
            <div className="mt-4 space-y-3">
              <div className="relative h-48 w-48 overflow-hidden border border-border bg-black">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={coverPreview}
                  alt="커버 미리보기"
                  className="h-full w-full object-cover"
                  style={
                    coverFile
                      ? {
                          transform: `scale(${coverZoom}) translate(${coverOffsetX}%, ${coverOffsetY}%)`,
                          transformOrigin: "center",
                        }
                      : undefined
                  }
                />
              </div>
              {coverFile && (
                <>
                  <input type="range" min="1" max="3" step="0.01" value={coverZoom} onChange={(e) => setCoverZoom(Number(e.target.value))} className="w-full" />
                  <input type="range" min="-100" max="100" step="1" value={coverOffsetX} onChange={(e) => setCoverOffsetX(Number(e.target.value))} className="w-full" />
                  <input type="range" min="-100" max="100" step="1" value={coverOffsetY} onChange={(e) => setCoverOffsetY(Number(e.target.value))} className="w-full" />
                </>
              )}
              {!coverFile && currentCoverUrl && (
                <p className="text-xs text-muted">새 이미지를 선택하면 크롭 후 교체됩니다.</p>
              )}
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

          {activeTracks.map((row, index) => (
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
                  {activeTracks.length > 1 && (
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
              <input
                type="file"
                accept="audio/*"
                onChange={(e) => updateTrack(row.key, { audioFile: e.target.files?.[0] ?? null })}
                className="w-full border border-border px-4 py-3 text-sm"
              />
              {row.audio_url && !row.audioFile && (
                <p className="text-xs text-muted">현재 음원이 등록되어 있습니다. 변경 시에만 파일을 선택하세요.</p>
              )}
              <input
                type="number"
                min={0}
                placeholder="트랙 디지털 판매가 (비워두면 미판매)"
                value={row.digitalPrice}
                onChange={(e) => updateTrack(row.key, { digitalPrice: e.target.value })}
                className="w-full border border-border bg-transparent px-4 py-3 text-sm outline-none focus:border-foreground"
              />
              <label className="block text-[10px] uppercase tracking-widest text-muted">WAV 원본 (구매 다운로드용)</label>
              <input
                type="file"
                accept="audio/wav,audio/x-wav,.wav"
                onChange={(e) => updateTrack(row.key, { wavFile: e.target.files?.[0] ?? null })}
                className="w-full border border-border px-4 py-3 text-sm"
              />
              {row.download_wav_url && !row.wavFile && (
                <p className="text-xs text-muted">WAV가 등록되어 있습니다. 교체 시에만 선택하세요.</p>
              )}
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
          disabled={saving || artists.length === 0}
          className="w-full bg-foreground py-3 text-xs uppercase tracking-widest text-background disabled:opacity-50"
        >
          {saving ? "저장 중..." : "변경사항 저장"}
        </button>
      </form>

      <button
        type="button"
        onClick={handleDeleteAlbum}
        disabled={saving}
        className="mt-6 w-full border border-rose-200 py-3 text-xs uppercase tracking-widest text-rose-500 hover:border-rose-500 disabled:opacity-50"
      >
        이 앨범 삭제
      </button>
    </div>
  );
}
