"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function NewArtistPage() {
  const router = useRouter();
  const supabase = createClient();
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
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
        const path = `artists/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("images")
          .upload(path, imageFile);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from("images").getPublicUrl(path);
        image_url = urlData.publicUrl;
      }

      const { error: insertError } = await supabase.from("artists").insert({
        name,
        bio: bio || null,
        image_url,
      });
      if (insertError) throw insertError;

      router.push("/admin/artists");
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
          <h1 className="mt-1 text-xl font-medium uppercase tracking-wider">아티스트 등록</h1>
        </div>
        <Link href="/admin/artists" className="text-[10px] uppercase tracking-widest text-muted underline">
          목록으로
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="mb-1.5 block text-[10px] uppercase tracking-widest text-muted">
            이름 *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full border border-border bg-transparent px-4 py-3 text-sm outline-none placeholder:text-muted focus:border-foreground"
            placeholder="아티스트 이름"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-[10px] uppercase tracking-widest text-muted">
            소개
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            className="w-full resize-none border border-border bg-transparent px-4 py-3 text-sm outline-none placeholder:text-muted focus:border-foreground"
            placeholder="아티스트 소개"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-[10px] uppercase tracking-widest text-muted">
            프로필 이미지
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImage}
            className="w-full border border-border px-4 py-3 text-sm file:mr-4 file:border-0 file:bg-transparent file:text-xs file:uppercase file:tracking-widest"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {preview && <img src={preview} alt="미리보기" className="mt-3 h-32 w-32 object-cover" />}
        </div>

        {error && <p className="text-xs text-rose-500">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-foreground py-3 text-xs uppercase tracking-widest text-background transition-opacity disabled:opacity-50"
        >
          {loading ? "등록 중..." : "아티스트 등록"}
        </button>
      </form>
    </div>
  );
}
