"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface Artist {
  id: string;
  name: string;
}

export default function NewMusicPage() {
  const router = useRouter();
  const supabase = createClient();

  const [title, setTitle] = useState("");
  const [artistId, setArtistId] = useState("");
  const [artists, setArtists] = useState<Artist[]>([]);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.from("artists").select("id, name").order("name").then(({ data }) => {
      setArtists(data ?? []);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCover = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setCoverFile(file);
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

      // 커버 업로드
      let cover_url: string | null = null;
      if (coverFile) {
        const coverExt = coverFile.name.split(".").pop();
        const coverPath = `covers/${Date.now()}.${coverExt}`;
        const { error: coverErr } = await supabase.storage.from("images").upload(coverPath, coverFile);
        if (coverErr) throw coverErr;
        const { data: coverUrlData } = supabase.storage.from("images").getPublicUrl(coverPath);
        cover_url = coverUrlData.publicUrl;
      }

      const { error: insertError } = await supabase.from("tracks").insert({
        title,
        artist_id: artistId || null,
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
            아티스트
          </label>
          <select
            value={artistId}
            onChange={(e) => setArtistId(e.target.value)}
            className="w-full border border-border bg-background px-4 py-3 text-sm outline-none focus:border-foreground"
          >
            <option value="">아티스트 선택 (선택사항)</option>
            {artists.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
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
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {coverPreview && <img src={coverPreview} alt="커버 미리보기" className="mt-3 h-32 w-32 object-cover" />}
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
