"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function NewEventPage() {
  const router = useRouter();
  const supabase = createClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setImageFile(file);
    if (file) setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      let image_url: string | null = null;
      if (imageFile) {
        const ext = imageFile.name.split(".").pop();
        const path = `events/${Date.now()}.${ext}`;
        const { error: uploadErr } = await supabase.storage.from("images").upload(path, imageFile);
        if (uploadErr) throw uploadErr;
        const { data: urlData } = supabase.storage.from("images").getPublicUrl(path);
        image_url = urlData.publicUrl;
      }

      const { error: insertError } = await supabase.from("events").insert({
        title,
        description: description || null,
        image_url,
        start_at: startAt || null,
        end_at: endAt || null,
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
        <h1 className="mt-1 text-xl font-medium uppercase tracking-wider">이벤트 등록</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="mb-1.5 block text-[10px] uppercase tracking-widest text-muted">제목 *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full border border-border bg-transparent px-4 py-3 text-sm outline-none placeholder:text-muted focus:border-foreground"
            placeholder="이벤트 제목"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-[10px] uppercase tracking-widest text-muted">설명</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full resize-none border border-border bg-transparent px-4 py-3 text-sm outline-none placeholder:text-muted focus:border-foreground"
            placeholder="이벤트 설명"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-[10px] uppercase tracking-widest text-muted">시작일</label>
            <input
              type="datetime-local"
              value={startAt}
              onChange={(e) => setStartAt(e.target.value)}
              className="w-full border border-border bg-transparent px-4 py-3 text-sm outline-none focus:border-foreground"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[10px] uppercase tracking-widest text-muted">종료일</label>
            <input
              type="datetime-local"
              value={endAt}
              onChange={(e) => setEndAt(e.target.value)}
              className="w-full border border-border bg-transparent px-4 py-3 text-sm outline-none focus:border-foreground"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-[10px] uppercase tracking-widest text-muted">이미지</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImage}
            className="w-full border border-border px-4 py-3 text-sm file:mr-4 file:border-0 file:bg-transparent file:text-xs file:uppercase file:tracking-widest"
          />
          {preview && (
            <img src={preview} alt="미리보기" className="mt-3 h-40 w-full object-cover" />
          )}
        </div>

        {error && <p className="text-xs text-rose-500">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-foreground py-3 text-xs uppercase tracking-widest text-background transition-opacity disabled:opacity-50"
        >
          {loading ? "등록 중..." : "이벤트 등록"}
        </button>
      </form>
    </div>
  );
}
