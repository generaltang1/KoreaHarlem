"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

async function buildCroppedCover(
  file: File,
  zoom: number,
  offsetX: number,
  offsetY: number,
) {
  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("이미지 로드에 실패했습니다."));
      img.src = objectUrl;
    });

    const sourceW = image.naturalWidth;
    const sourceH = image.naturalHeight;
    const base = Math.min(sourceW, sourceH);
    const cropSize = base / zoom;

    const maxShiftX = (sourceW - cropSize) / 2;
    const maxShiftY = (sourceH - cropSize) / 2;

    const centerX = sourceW / 2 + (offsetX / 100) * maxShiftX;
    const centerY = sourceH / 2 + (offsetY / 100) * maxShiftY;

    const sx = clamp(centerX - cropSize / 2, 0, sourceW - cropSize);
    const sy = clamp(centerY - cropSize / 2, 0, sourceH - cropSize);

    const canvas = document.createElement("canvas");
    canvas.width = 1000;
    canvas.height = 1000;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("이미지 처리 컨텍스트를 생성할 수 없습니다.");

    ctx.drawImage(
      image,
      sx,
      sy,
      cropSize,
      cropSize,
      0,
      0,
      canvas.width,
      canvas.height,
    );

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((result) => {
        if (!result) {
          reject(new Error("크롭 이미지 생성에 실패했습니다."));
          return;
        }
        resolve(result);
      }, "image/jpeg", 0.92);
    });

    return new File([blob], `cover-${Date.now()}.jpg`, { type: "image/jpeg" });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export default function NewMusicPage() {
  const router = useRouter();
  const supabase = createClient();

  const [title, setTitle] = useState("");
  const [artistName, setArtistName] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverZoom, setCoverZoom] = useState(1);
  const [coverOffsetX, setCoverOffsetX] = useState(0);
  const [coverOffsetY, setCoverOffsetY] = useState(0);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!audioFile) { setError("음원 파일을 선택해주세요."); return; }
    setLoading(true);

    try {
      // 음원 업로드
      const audioExt = audioFile.name.split(".").pop();
      const audioPath = `tracks/${Date.now()}.${audioExt}`;
      const { error: audioErr } = await supabase.storage.from("audio").upload(audioPath, audioFile);
      if (audioErr) throw audioErr;
      const { data: audioUrlData } = supabase.storage.from("audio").getPublicUrl(audioPath);

      // 아티스트 텍스트 입력값을 기준으로 기존 조회 또는 신규 생성
      let artistId: string | null = null;
      const artistNameTrimmed = artistName.trim();
      if (artistNameTrimmed) {
        const { data: existingArtist, error: findArtistErr } = await supabase
          .from("artists")
          .select("id")
          .eq("name", artistNameTrimmed)
          .maybeSingle();
        if (findArtistErr) throw findArtistErr;

        if (existingArtist?.id) {
          artistId = existingArtist.id;
        } else {
          const { data: createdArtist, error: createArtistErr } = await supabase
            .from("artists")
            .insert({ name: artistNameTrimmed })
            .select("id")
            .single();
          if (createArtistErr) throw createArtistErr;
          artistId = createdArtist.id;
        }
      }

      // 커버 업로드
      let cover_url: string | null = null;
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
        cover_url = coverUrlData.publicUrl;
      }

      const { error: insertError } = await supabase.from("tracks").insert({
        title,
        artist_id: artistId,
        audio_url: audioUrlData.publicUrl,
        cover_url,
      });
      if (insertError) throw insertError;

      router.push("/admin");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "등록 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <p className="text-[10px] uppercase tracking-widest text-muted">Admin</p>
        <h1 className="mt-1 text-xl font-medium uppercase tracking-wider">음악 등록</h1>
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
            placeholder="트랙 제목"
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
            placeholder="아티스트명 입력 (신규면 자동 생성)"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-[10px] uppercase tracking-widest text-muted">
            음원 파일 * (MP3, WAV 등)
          </label>
          <input
            type="file"
            accept="audio/*"
            onChange={(e) => setAudioFile(e.target.files?.[0] ?? null)}
            required
            className="w-full border border-border px-4 py-3 text-sm file:mr-4 file:border-0 file:bg-transparent file:text-xs file:uppercase file:tracking-widest"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-[10px] uppercase tracking-widest text-muted">
            앨범 커버 이미지
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleCover}
            className="w-full border border-border px-4 py-3 text-sm file:mr-4 file:border-0 file:bg-transparent file:text-xs file:uppercase file:tracking-widest"
          />
          {coverPreview && (
            <div className="mt-4 space-y-4">
              <p className="text-xs text-muted">미리보기 / 크롭 영역</p>
              <div className="relative h-56 w-56 overflow-hidden border border-border bg-black">
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
            </div>
          )}
        </div>

        {error && <p className="text-xs text-rose-500">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-foreground py-3 text-xs uppercase tracking-widest text-background transition-opacity disabled:opacity-50"
        >
          {loading ? "등록 중..." : "음악 등록"}
        </button>
      </form>
    </div>
  );
}
