"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { buildCroppedCover } from "@/lib/image/cropCover";

interface TrackFormRow {
  key: string;
  title: string;
  description: string;
  audioFile: File | null;
  isTitleTrack: boolean;
}

function newTrackRow(): TrackFormRow {
  return {
    key: crypto.randomUUID(),
    title: "",
    description: "",
    audioFile: null,
    isTitleTrack: false,
  };
}

export default function NewAlbumPage() {
  const router = useRouter();
  const supabase = createClient();

  const [title, setTitle] = useState("");
  const [artistName, setArtistName] = useState("");
  const [description, setDescription] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverZoom, setCoverZoom] = useState(1);
  const [coverOffsetX, setCoverOffsetX] = useState(0);
  const [coverOffsetY, setCoverOffsetY] = useState(0);
  const [tracks, setTracks] = useState<TrackFormRow[]>([newTrackRow()]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
      prev.map((row) => ({
        ...row,
        isTitleTrack: row.key === key ? !row.isTitleTrack : false,
      })),
    );
  };

  const addTrackRow = () => setTracks((prev) => [...prev, newTrackRow()]);

  const removeTrackRow = (key: string) => {
    setTracks((prev) => (prev.length <= 1 ? prev : prev.filter((row) => row.key !== key)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const validTracks = tracks.filter((row) => row.title.trim() && row.audioFile);
    if (validTracks.length === 0) {
      setError("수록곡 1개 이상(제목 + 음원 파일)을 등록해주세요.");
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

      const { data: album, error: albumErr } = await supabase
        .from("albums")
        .insert({
          title,
          artist_name: artistName.trim() || null,
          description: description.trim() || null,
          cover_url,
        })
        .select("id")
        .single();
      if (albumErr || !album) throw albumErr ?? new Error("앨범 생성 실패");

      for (let i = 0; i < validTracks.length; i++) {
        const row = validTracks[i];
        const audioFile = row.audioFile!;
        const audioExt = audioFile.name.split(".").pop();
        const audioPath = `tracks/${album.id}/${Date.now()}-${i}.${audioExt}`;
        const { error: audioErr } = await supabase.storage.from("audio").upload(audioPath, audioFile);
        if (audioErr) throw audioErr;
        const { data: audioUrlData } = supabase.storage.from("audio").getPublicUrl(audioPath);

        const { error: trackErr } = await supabase.from("album_tracks").insert({
          album_id: album.id,
          track_order: i + 1,
          title: row.title.trim(),
          description: row.description.trim() || null,
          audio_url: audioUrlData.publicUrl,
          is_title_track: row.isTitleTrack,
        });
        if (trackErr) throw trackErr;
      }

      router.push("/admin/music");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "등록 중 오류가 발생했습니다.");
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
        </div>
        <Link href="/admin/music" className="text-[10px] uppercase tracking-widest text-muted underline">
          목록으로
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
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
          <label className="mb-1.5 block text-[10px] uppercase tracking-widest text-muted">아티스트명</label>
          <input
            type="text"
            value={artistName}
            onChange={(e) => setArtistName(e.target.value)}
            className="w-full border border-border bg-transparent px-4 py-3 text-sm outline-none focus:border-foreground"
            placeholder="표시용 아티스트명"
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
              <input
                type="file"
                accept="audio/*"
                onChange={(e) => updateTrack(row.key, { audioFile: e.target.files?.[0] ?? null })}
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
          disabled={loading}
          className="w-full bg-foreground py-3 text-xs uppercase tracking-widest text-background disabled:opacity-50"
        >
          {loading ? "등록 중..." : "앨범 등록"}
        </button>
      </form>
    </div>
  );
}
