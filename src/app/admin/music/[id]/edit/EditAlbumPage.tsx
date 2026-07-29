"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { buildCroppedCover } from "@/lib/image/cropCover";

interface EditAlbumPageProps {
  albumId: string;
}

interface TrackEditRow {
  key: string;
  id?: string;
  title: string;
  description: string;
  audio_url?: string;
  audioFile: File | null;
  removed: boolean;
}

function newTrackRow(): TrackEditRow {
  return {
    key: crypto.randomUUID(),
    title: "",
    description: "",
    audioFile: null,
    removed: false,
  };
}

export default function EditAlbumPage({ albumId }: EditAlbumPageProps) {
  const router = useRouter();
  const supabase = createClient();

  const [title, setTitle] = useState("");
  const [artistName, setArtistName] = useState("");
  const [description, setDescription] = useState("");
  const [currentCoverUrl, setCurrentCoverUrl] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverZoom, setCoverZoom] = useState(1);
  const [coverOffsetX, setCoverOffsetX] = useState(0);
  const [coverOffsetY, setCoverOffsetY] = useState(0);
  const [tracks, setTracks] = useState<TrackEditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadAlbum = async () => {
      setLoading(true);
      setError("");

      const { data, error: fetchError } = await supabase
        .from("albums")
        .select("title, artist_name, description, cover_url, album_tracks(*)")
        .eq("id", albumId)
        .single();

      if (fetchError || !data) {
        setError("앨범 정보를 불러오지 못했습니다.");
        setLoading(false);
        return;
      }

      setTitle(data.title);
      setArtistName(data.artist_name ?? "");
      setDescription(data.description ?? "");
      setCurrentCoverUrl(data.cover_url);
      setCoverPreview(data.cover_url);

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
          audioFile: null,
          removed: false,
        })),
      );
      setLoading(false);
    };

    loadAlbum();
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
        artist_name: string | null;
        description: string | null;
        cover_url?: string | null;
      } = {
        title,
        artist_name: artistName.trim() || null,
        description: description.trim() || null,
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

        if (row.audioFile) {
          const audioExt = row.audioFile.name.split(".").pop();
          const audioPath = `tracks/${albumId}/${Date.now()}-${i}.${audioExt}`;
          const { error: audioErr } = await supabase.storage
            .from("audio")
            .upload(audioPath, row.audioFile);
          if (audioErr) throw audioErr;
          const { data: audioUrlData } = supabase.storage.from("audio").getPublicUrl(audioPath);
          audio_url = audioUrlData.publicUrl;
        }

        if (row.id) {
          const { error: updateErr } = await supabase
            .from("album_tracks")
            .update({
              track_order: i + 1,
              title: row.title.trim(),
              description: row.description.trim() || null,
              audio_url: audio_url!,
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
          });
          if (insertErr) throw insertErr;
        }
      }

      router.push("/admin/music");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "수정 중 오류가 발생했습니다.");
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
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium">수록곡 {index + 1}</p>
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
              <textarea
                placeholder="곡 설명 (선택)"
                value={row.description}
                onChange={(e) => updateTrack(row.key, { description: e.target.value })}
                rows={3}
                className="w-full resize-none border border-border bg-transparent px-4 py-3 text-sm outline-none focus:border-foreground"
              />
            </div>
          ))}
        </div>

        {error && <p className="text-xs text-rose-500">{error}</p>}

        <button
          type="submit"
          disabled={saving}
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
