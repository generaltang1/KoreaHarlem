"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GenreSearchSelect } from "@/components/admin/GenreSearchSelect";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { writeAdminAudit } from "@/lib/adminAudit";
import { createClient } from "@/lib/supabase/client";

interface EditArtistPageProps {
  artistId: string;
}

type ActivityType = "solo" | "group" | "";

export default function EditArtistPage({ artistId }: EditArtistPageProps) {
  const router = useRouter();
  const supabase = createClient();

  const [name, setName] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [activityType, setActivityType] = useState<ActivityType>("");
  const [genre, setGenre] = useState("");
  const [debutDate, setDebutDate] = useState("");
  const [agency, setAgency] = useState("");
  const [bio, setBio] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [managerEmail, setManagerEmail] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [isDraft, setIsDraft] = useState(false);
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
        .select(
          "name, name_en, activity_type, genre, debut_date, agency, bio, instagram_url, youtube_url, website_url, manager_email, image_url, is_public, is_draft",
        )
        .eq("id", artistId)
        .single();

      if (fetchError || !data) {
        setError("아티스트 정보를 불러오지 못했습니다.");
        setLoading(false);
        return;
      }

      setName(data.name ?? "");
      setNameEn(data.name_en ?? "");
      setActivityType((data.activity_type as ActivityType) || "");
      setGenre(data.genre ?? "");
      setDebutDate(data.debut_date ?? "");
      setAgency(data.agency ?? "");
      setBio(data.bio ?? "");
      setInstagramUrl(data.instagram_url ?? "");
      setYoutubeUrl(data.youtube_url ?? "");
      setWebsiteUrl(data.website_url ?? "");
      setManagerEmail(data.manager_email ?? "");
      setIsPublic(data.is_public ?? true);
      setIsDraft(data.is_draft ?? false);
      setCurrentImageUrl(data.image_url);
      setPreview(data.image_url);
      setLoading(false);
    };

    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [artistId]);

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setImageFile(file);
    if (file) setPreview(URL.createObjectURL(file));
  };

  const save = async (asDraft: boolean) => {
    setError("");
    if (!name.trim()) {
      setError("아티스트명을 입력해주세요.");
      return;
    }
    setSaving(true);

    try {
      const update: Record<string, unknown> = {
        name: name.trim(),
        name_en: nameEn.trim() || null,
        activity_type: activityType || null,
        genre: genre.trim() || null,
        debut_date: debutDate || null,
        agency: agency.trim() || null,
        bio: bio.trim() || null,
        instagram_url: instagramUrl.trim() || null,
        youtube_url: youtubeUrl.trim() || null,
        website_url: websiteUrl.trim() || null,
        manager_email: managerEmail.trim() || null,
        is_public: isPublic,
        is_draft: asDraft,
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

      if (typeof update.name === "string" && update.name) {
        await supabase
          .from("albums")
          .update({ artist_name: update.name })
          .eq("artist_id", artistId);
      }

      await writeAdminAudit({
        module: "artists",
        action: asDraft ? "draft" : "update",
        targetType: "artist",
        targetId: artistId,
        summary: asDraft
          ? `아티스트 임시저장: ${update.name}`
          : `아티스트 수정: ${update.name}`,
        meta: { is_draft: asDraft, is_public: isPublic, genre: update.genre },
      });

      setIsDraft(asDraft);
      router.push("/admin/artists");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "수정 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await save(false);
  };

  const handleDelete = async () => {
    if (!confirm(`"${name}" 아티스트를 삭제할까요?`)) return;

    setSaving(true);
    setError("");

    const { error: deleteError } = await supabase.from("artists").delete().eq("id", artistId);
    setSaving(false);

    if (deleteError) {
      if (/foreign key|violates|restrict/i.test(deleteError.message)) {
        setError(
          "이 아티스트에 연결된 앨범이 있어 삭제할 수 없습니다. 앨범을 먼저 삭제하거나 다른 아티스트로 변경해주세요.",
        );
      } else {
        setError(deleteError.message);
      }
      return;
    }

    await writeAdminAudit({
      module: "artists",
      action: "delete",
      targetType: "artist",
      targetId: artistId,
      summary: `아티스트 삭제: ${name}`,
    });

    router.push("/admin/artists");
    router.refresh();
  };

  const inputClass =
    "w-full border border-border bg-transparent px-4 py-3 text-sm outline-none placeholder:text-muted focus:border-foreground";
  const labelClass = "mb-1.5 block text-[10px] uppercase tracking-widest text-muted";

  if (loading) {
    return <p className="text-sm text-muted">불러오는 중...</p>;
  }

  return (
    <div>
      <AdminPageHeader
        title="아티스트 수정"
        description={isDraft ? "현재 임시저장 상태" : "프로필 · 장르 · SNS · 공개 설정"}
        actions={
          <Link
            href="/admin/artists"
            className="text-[10px] uppercase tracking-widest text-muted underline"
          >
            목록으로
          </Link>
        }
      />

      <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-5">
        <div>
          <label className={labelClass}>아티스트명 *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>영문명</label>
          <input
            type="text"
            value={nameEn}
            onChange={(e) => setNameEn(e.target.value)}
            className={inputClass}
            placeholder="English name"
          />
        </div>

        <div>
          <label className={labelClass}>활동유형</label>
          <select
            value={activityType}
            onChange={(e) => setActivityType(e.target.value as ActivityType)}
            className={inputClass}
          >
            <option value="">선택</option>
            <option value="solo">솔로</option>
            <option value="group">그룹</option>
          </select>
        </div>

        <div>
          <label className={labelClass}>대표 장르</label>
          <GenreSearchSelect value={genre} onChange={setGenre} />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className={labelClass}>데뷔일</label>
            <input
              type="date"
              value={debutDate}
              onChange={(e) => setDebutDate(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>소속사</label>
            <input
              type="text"
              value={agency}
              onChange={(e) => setAgency(e.target.value)}
              className={inputClass}
              placeholder="소속사"
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>소개</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            className={`${inputClass} resize-none`}
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Instagram</label>
            <input
              type="url"
              value={instagramUrl}
              onChange={(e) => setInstagramUrl(e.target.value)}
              className={inputClass}
              placeholder="https://instagram.com/..."
            />
          </div>
          <div>
            <label className={labelClass}>YouTube</label>
            <input
              type="url"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              className={inputClass}
              placeholder="https://youtube.com/..."
            />
          </div>
          <div>
            <label className={labelClass}>Website</label>
            <input
              type="url"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              className={inputClass}
              placeholder="https://..."
            />
          </div>
          <div>
            <label className={labelClass}>매니저 이메일</label>
            <input
              type="email"
              value={managerEmail}
              onChange={(e) => setManagerEmail(e.target.value)}
              className={inputClass}
              placeholder="manager@example.com"
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>프로필 이미지 (변경 시에만 선택)</label>
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

        <div>
          <label className={labelClass}>공개 여부</label>
          <div className="flex gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="visibility"
                checked={isPublic}
                onChange={() => setIsPublic(true)}
              />
              공개
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="visibility"
                checked={!isPublic}
                onChange={() => setIsPublic(false)}
              />
              비공개
            </label>
          </div>
        </div>

        {error && <p className="text-xs text-rose-500">{error}</p>}

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            disabled={saving}
            onClick={() => void save(true)}
            className="flex-1 border border-border py-3 text-xs uppercase tracking-widest transition-opacity disabled:opacity-50"
          >
            {saving ? "저장 중..." : "임시저장"}
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 bg-foreground py-3 text-xs uppercase tracking-widest text-background transition-opacity disabled:opacity-50"
          >
            {saving ? "저장 중..." : "등록 / 저장"}
          </button>
        </div>
      </form>

      <button
        type="button"
        onClick={() => void handleDelete()}
        disabled={saving}
        className="mx-auto mt-6 block w-full max-w-2xl border border-rose-200 py-3 text-xs uppercase tracking-widest text-rose-500 hover:border-rose-500 disabled:opacity-50"
      >
        이 아티스트 삭제
      </button>
    </div>
  );
}
