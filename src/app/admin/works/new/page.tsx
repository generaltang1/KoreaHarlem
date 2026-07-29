"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface Artist {
  id: string;
  name: string;
}

const CATEGORIES = [
  { value: "music", label: "음악" },
  { value: "visual", label: "시각 예술" },
  { value: "performance", label: "공연" },
  { value: "literature", label: "문학" },
];

export default function NewWorkPage() {
  const router = useRouter();
  const supabase = createClient();

  const [title, setTitle] = useState("");
  const [artistId, setArtistId] = useState("");
  const [artists, setArtists] = useState<Artist[]>([]);
  const [category, setCategory] = useState("visual");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.from("artists").select("id, name").order("name").then(({ data }) => {
      setArtists(data ?? []);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        const path = `works/${Date.now()}.${ext}`;
        const { error: uploadErr } = await supabase.storage.from("images").upload(path, imageFile);
        if (uploadErr) throw uploadErr;
        const { data: urlData } = supabase.storage.from("images").getPublicUrl(path);
        image_url = urlData.publicUrl;
      }

      const { error: insertError } = await supabase.from("works").insert({
        title,
        artist_id: artistId || null,
        category,
        price: price ? parseInt(price) : null,
        description: description || null,
        image_url,
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
        <h1 className="mt-1 text-xl font-medium uppercase tracking-wider">상품 등록</h1>
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
            placeholder="작품/상품 제목"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-[10px] uppercase tracking-widest text-muted">아티스트</label>
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
          <label className="mb-1.5 block text-[10px] uppercase tracking-widest text-muted">카테고리 *</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
            className="w-full border border-border bg-background px-4 py-3 text-sm outline-none focus:border-foreground"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-[10px] uppercase tracking-widest text-muted">가격 (원)</label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full border border-border bg-transparent px-4 py-3 text-sm outline-none placeholder:text-muted focus:border-foreground"
            placeholder="0"
            min="0"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-[10px] uppercase tracking-widest text-muted">설명</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full resize-none border border-border bg-transparent px-4 py-3 text-sm outline-none placeholder:text-muted focus:border-foreground"
            placeholder="상품 설명"
          />
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
            <img src={preview} alt="미리보기" className="mt-3 h-40 w-40 object-cover" />
          )}
        </div>

        {error && <p className="text-xs text-rose-500">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-foreground py-3 text-xs uppercase tracking-widest text-background transition-opacity disabled:opacity-50"
        >
          {loading ? "등록 중..." : "상품 등록"}
        </button>
      </form>
    </div>
  );
}
