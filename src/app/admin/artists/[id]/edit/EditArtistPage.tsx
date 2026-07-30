"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface EditArtistPageProps {
  artistId: string;
}

export default function EditArtistPage({ artistId }: EditArtistPageProps) {
  const router = useRouter();
  const supabase = createClient();

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");

      const { data, error: fetchError } = await supabase
        .from("artists")
        .select("name, bio, image_url")
        .eq("id", artistId)
        .single();

      if (fetchError || !data) {
        setError("아티스트 정보를 불러오지 못했습니다.");
        setLoading(false);
        return;
      }

      setName(data.name);
      setBio(data.bio ?? "");
      setCurrentImageUrl(data.image_url);
      setPreview(data.image_url);
      setLoading(false);
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [artistId]);

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setImageFile(file);
    if (file) setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const update: {
        name: string;
        bio: string | null;
        image_url?: string | null;
      } = {
        name: name.trim(),
        bio: bio.trim() || null,
      };

      if (imageFile) {
        const ext = imageFile.name.split(".").pop();
        const path = `artists/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("images")
          .upload(path, imageFile);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from("images").getPublicUrl(path);
        update.image_url = urlData.publicUrl;
      }

      const { error: updateError } = await supabase
        .from("artists")
        .update(update)
        .eq("id", artistId);
      if (updateError) throw updateError;

      // Keep album display names in sync when artist is renamed.
      if (update.name) {
        await supabase
          .from("albums")
          .update({ artist_name: update.name })
          .eq("artist_id", artistId);
      }

      router.push("/admin/artists");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "수정 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`"${name}" 아티스트를 삭제할까요?`)) return;

    setSaving(true);
    setError("");

    const { error: deleteError } = await supabase.from("artists").delete().eq("id", artistId);
    setSaving(false);

    if (deleteError) {
      if (/foreign key|violates|restrict/i.test(deleteError.message)) {
        setError("이 아티스트에 연결된 앨범이 있어 삭제할 수 없습니다. 앨범을 먼저 삭제하거나 다른 아티스트로 변경해주세요.");
      } else {
        setError(deleteError.message);
      }
      return;
    }

    router.push("/admin/artists");
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
          <h1 className="mt-1 text-xl font-medium uppercase tracking-wider">아티스트 수정</h1>
        </div>
        <Link href="/admin/artists" className="text-[10px] uppercase tracking-widest text-muted underline">
          목록으로
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="mb-1.5 block text-[10px] uppercase tracking-widest text-muted">이름 *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full border border-border bg-transparent px-4 py-3 text-sm outline-none placeholder:text-muted focus:border-foreground"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-[10px] uppercase tracking-widest text-muted">소개</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            className="w-full resize-none border border-border bg-transparent px-4 py-3 text-sm outline-none placeholder:text-muted focus:border-foreground"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-[10px] uppercase tracking-widest text-muted">
            프로필 이미지 (변경 시에만 선택)
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImage}
            className="w-full border border-border px-4 py-3 text-sm file:mr-4 file:border-0 file:bg-transparent file:text-xs file:uppercase file:tracking-widest"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {preview && <img src={preview} alt="미리보기" className="mt-3 h-32 w-32 object-cover" />}
          {!imageFile && currentImageUrl && (
            <p className="mt-2 text-xs text-muted">새 이미지를 선택하면 교체됩니다.</p>
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
        className="mt-6 w-full border border-rose-200 py-3 text-xs uppercase tracking-widest text-rose-500 hover:border-rose-500 disabled:opacity-50"
      >
        이 아티스트 삭제
      </button>
    </div>
  );
}
