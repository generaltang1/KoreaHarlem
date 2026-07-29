"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { buildCroppedCover } from "@/lib/image/cropCover";
import { getArtistName } from "@/lib/tracks";

interface EditMusicPageProps {
  trackId: string;
}

export default function EditMusicPage({ trackId }: EditMusicPageProps) {
  const router = useRouter();
  const supabase = createClient();

  const [title, setTitle] = useState("");
  const [artistName, setArtistName] = useState("");
  const [description, setDescription] = useState("");
  const [currentCoverUrl, setCurrentCoverUrl] = useState<string | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverZoom, setCoverZoom] = useState(1);
  const [coverOffsetX, setCoverOffsetX] = useState(0);
  const [coverOffsetY, setCoverOffsetY] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadTrack = async () => {
      setLoading(true);
      setError("");

      const { data, error: fetchError } = await supabase
        .from("tracks")
        .select("title, description, cover_url, artists(name)")
        .eq("id", trackId)
        .single();

      if (fetchError || !data) {
        setError("곡 정보를 불러오지 못했습니다.");
        setLoading(false);
        return;
      }

      setTitle(data.title);
      setDescription(data.description ?? "");
      setCurrentCoverUrl(data.cover_url);
      setCoverPreview(data.cover_url);

      setArtistName(getArtistName(data.artists));
      setLoading(false);
    };

    loadTrack();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackId]);

  const handleCover = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setCoverFile(file);
    setCoverZoom(1);
    setCoverOffsetX(0);
    setCoverOffsetY(0);
    if (file) setCoverPreview(URL.createObjectURL(file));
  };

  const resolveArtistId = async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return null;

    const { data: existingArtist, error: findArtistErr } = await supabase
      .from("artists")
      .select("id")
      .eq("name", trimmed)
      .maybeSingle();
    if (findArtistErr) throw findArtistErr;

    if (existingArtist?.id) return existingArtist.id;

    const { data: createdArtist, error: createArtistErr } = await supabase
      .from("artists")
      .insert({ name: trimmed })
      .select("id")
      .single();
    if (createArtistErr) throw createArtistErr;
    return createdArtist.id;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const updateData: {
        title: string;
        artist_id: string | null;
        description: string | null;
        audio_url?: string;
        cover_url?: string | null;
      } = {
        title,
        artist_id: await resolveArtistId(artistName),
        description: description.trim() || null,
      };

      if (audioFile) {
        const audioExt = audioFile.name.split(".").pop();
        const audioPath = `tracks/${Date.now()}.${audioExt}`;
        const { error: audioErr } = await supabase.storage.from("audio").upload(audioPath, audioFile);
        if (audioErr) throw audioErr;
        const { data: audioUrlData } = supabase.storage.from("audio").getPublicUrl(audioPath);
        updateData.audio_url = audioUrlData.publicUrl;
      }

      if (coverFile) {
        const croppedCoverFile = await buildCroppedCover(
          coverFile,
          coverZoom,
          coverOffsetX,
          coverOffsetY,
        );
        const coverPath = `covers/${Date.now()}.jpg`;
        const { error: coverErr } = await supabase.storage
          .from("images")
          .upload(coverPath, croppedCoverFile);
        if (coverErr) throw coverErr;
        const { data: coverUrlData } = supabase.storage.from("images").getPublicUrl(coverPath);
        updateData.cover_url = coverUrlData.publicUrl;
      }

      const { error: updateError } = await supabase
        .from("tracks")
        .update(updateData)
        .eq("id", trackId);
      if (updateError) throw updateError;

      router.push("/admin/music");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "수정 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`"${title}" 곡을 삭제할까요?`)) return;

    setSaving(true);
    setError("");

    const { error: deleteError } = await supabase.from("tracks").delete().eq("id", trackId);
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
          <h1 className="mt-1 text-xl font-medium uppercase tracking-wider">음악 수정</h1>
        </div>
        <Link
          href="/admin/music"
          className="text-[10px] uppercase tracking-widest text-muted underline"
        >
          목록으로
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="mb-1.5 block text-[10px] uppercase tracking-widest text-muted">
            제목 *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full border border-border bg-transparent px-4 py-3 text-sm outline-none placeholder:text-muted focus:border-foreground"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-[10px] uppercase tracking-widest text-muted">
            아티스트명
          </label>
          <input
            type="text"
            value={artistName}
            onChange={(e) => setArtistName(e.target.value)}
            className="w-full border border-border bg-transparent px-4 py-3 text-sm outline-none placeholder:text-muted focus:border-foreground"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-[10px] uppercase tracking-widest text-muted">
            설명
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full resize-none border border-border bg-transparent px-4 py-3 text-sm outline-none placeholder:text-muted focus:border-foreground"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-[10px] uppercase tracking-widest text-muted">
            음원 파일 (변경 시에만 선택)
          </label>
          <input
            type="file"
            accept="audio/*"
            onChange={(e) => setAudioFile(e.target.files?.[0] ?? null)}
            className="w-full border border-border px-4 py-3 text-sm file:mr-4 file:border-0 file:bg-transparent file:text-xs file:uppercase file:tracking-widest"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-[10px] uppercase tracking-widest text-muted">
            앨범 커버 이미지 (변경 시에만 선택)
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleCover}
            className="w-full border border-border px-4 py-3 text-sm file:mr-4 file:border-0 file:bg-transparent file:text-xs file:uppercase file:tracking-widest"
          />
          {coverPreview && (
            <div className="mt-4 space-y-4">
              <p className="text-xs text-muted">
                {coverFile ? "미리보기 / 크롭 영역" : "현재 커버"}
              </p>
              <div className="relative h-56 w-56 overflow-hidden border border-border bg-black">
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
                <div className="space-y-3">
                  <label className="block text-[10px] uppercase tracking-widest text-muted">
                    확대/축소 ({coverZoom.toFixed(2)}x)
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="3"
                    step="0.01"
                    value={coverZoom}
                    onChange={(e) => setCoverZoom(Number(e.target.value))}
                    className="w-full"
                  />
                  <label className="block text-[10px] uppercase tracking-widest text-muted">
                    좌우 이동 ({coverOffsetX}%)
                  </label>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    step="1"
                    value={coverOffsetX}
                    onChange={(e) => setCoverOffsetX(Number(e.target.value))}
                    className="w-full"
                  />
                  <label className="block text-[10px] uppercase tracking-widest text-muted">
                    상하 이동 ({coverOffsetY}%)
                  </label>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    step="1"
                    value={coverOffsetY}
                    onChange={(e) => setCoverOffsetY(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
              )}
              {!coverFile && currentCoverUrl && (
                <p className="text-xs text-muted">새 이미지를 선택하면 크롭 후 교체됩니다.</p>
              )}
            </div>
          )}
        </div>

        {error && <p className="text-xs text-rose-500">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-foreground py-3 text-xs uppercase tracking-widest text-background transition-opacity disabled:opacity-50"
        >
          {saving ? "저장 중..." : "변경사항 저장"}
        </button>
      </form>

      <button
        type="button"
        onClick={handleDelete}
        disabled={saving}
        className="mt-6 w-full border border-rose-200 py-3 text-xs uppercase tracking-widest text-rose-500 transition-colors hover:border-rose-500 disabled:opacity-50"
      >
        이 곡 삭제
      </button>
    </div>
  );
}
