"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { MagazineBlockEditor } from "@/components/magazine/MagazineBlockEditor";
import { MagazineBlockRenderer } from "@/components/magazine/MagazineBlockRenderer";
import type { MagazineCategory, MagazinePost, MagazineStatus } from "@/lib/magazine";
import {
  blocksToHtml,
  blocksToPlainExcerpt,
  createEmptyBlock,
  normalizeHashtags,
  parseBlocks,
  parseRelatedLinks,
  slugifyTitle,
  type MagazineBlock,
  type MagazineRelatedLink,
} from "@/lib/magazineBlocks";
import { createClient } from "@/lib/supabase/client";

function toLocalInputValue(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function MagazineEditorClient({
  initial,
  mode,
}: {
  initial?: MagazinePost | null;
  mode: "new" | "edit";
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [excerpt, setExcerpt] = useState(initial?.excerpt ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [category, setCategory] = useState<MagazineCategory>(
    initial?.category === "news" ? "news" : "culture",
  );
  const [blocks, setBlocks] = useState<MagazineBlock[]>(() =>
    parseBlocks(initial?.content_blocks, initial?.content_html ?? ""),
  );
  const [coverUrl, setCoverUrl] = useState(initial?.cover_url ?? "");
  const [coverCredit, setCoverCredit] = useState(initial?.cover_credit ?? "");
  const [hashtagInput, setHashtagInput] = useState("");
  const [hashtags, setHashtags] = useState<string[]>(
    normalizeHashtags(initial?.hashtags ?? []),
  );
  const [creditText, setCreditText] = useState(initial?.credit_text ?? "");
  const [creditPhoto, setCreditPhoto] = useState(initial?.credit_photo ?? "");
  const [creditEdit, setCreditEdit] = useState(initial?.credit_edit ?? "");
  const [relatedLinks, setRelatedLinks] = useState<MagazineRelatedLink[]>(
    parseRelatedLinks(initial?.related_links),
  );
  const [showOnMusic, setShowOnMusic] = useState(Boolean(initial?.show_on_music));
  const [isCoverStory, setIsCoverStory] = useState(Boolean(initial?.is_cover_story));
  const [scheduledAt, setScheduledAt] = useState(
    toLocalInputValue(initial?.scheduled_at),
  );
  const [rightsOk, setRightsOk] = useState(false);
  const [originalOk, setOriginalOk] = useState(false);
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const effectiveExcerpt = useMemo(() => {
    const e = excerpt.trim();
    if (e) return e.slice(0, 120);
    return blocksToPlainExcerpt(blocks, 120);
  }, [excerpt, blocks]);

  const uploadImage = async (file: File): Promise<string | null> => {
    setUploading(true);
    setError("");
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("magazine")
        .upload(path, file, { upsert: false });
      if (upErr) throw new Error(upErr.message);
      const { data } = supabase.storage.from("magazine").getPublicUrl(path);
      return data.publicUrl;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "업로드 실패");
      return null;
    } finally {
      setUploading(false);
    }
  };

  const addHashtag = () => {
    const next = normalizeHashtags([...hashtags, hashtagInput]);
    setHashtags(next);
    setHashtagInput("");
  };

  const save = async (status: MagazineStatus) => {
    setError("");
    if (!title.trim()) {
      setError("제목을 입력해 주세요.");
      return;
    }
    if (status === "published" || status === "scheduled") {
      if (!rightsOk || !originalOk) {
        setError("발행 전 권리·원문 확인에 체크해 주세요.");
        return;
      }
    }
    if (status === "scheduled" && !scheduledAt) {
      setError("예약 발행 일시를 입력해 주세요.");
      return;
    }

    setSaving(true);
    try {
      const finalSlug = (slug.trim() || slugifyTitle(title)).slice(0, 80);
      const payload = {
        title: title.trim(),
        slug: finalSlug,
        excerpt: effectiveExcerpt,
        content_blocks: blocks.length ? blocks : [createEmptyBlock("paragraph")],
        content_html: blocksToHtml(blocks),
        cover_url: coverUrl || null,
        cover_credit: coverCredit.trim(),
        category,
        status,
        show_on_music: showOnMusic,
        is_cover_story: isCoverStory,
        hashtags,
        credit_text: creditText.trim(),
        credit_photo: creditPhoto.trim(),
        credit_edit: creditEdit.trim(),
        related_links: relatedLinks.filter((l) => l.url.trim()),
        scheduled_at:
          status === "scheduled"
            ? new Date(scheduledAt).toISOString()
            : null,
        published_at: status === "published" ? new Date().toISOString() : null,
      };

      const res =
        mode === "edit" && initial?.id
          ? await fetch(`/api/admin/magazine/${initial.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            })
          : await fetch("/api/admin/magazine", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "저장 실패");
      router.push("/admin/magazine");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "저장 중 오류");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 text-[#f4f1ea] [font-family:var(--font-f-sans),var(--font-geist-sans),sans-serif]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-[#6e6b65]">
            Magazine / {mode === "new" ? "New Post" : "Edit"}
          </p>
          <p className="mt-1 inline-flex rounded-[4px] bg-[#FEE500] px-2 py-0.5 text-[10px] font-semibold text-[#191919]">
            Admin Access Only
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setPreview((v) => !v)}
            className="rounded-[8px] border border-[rgba(244,241,234,0.12)] px-4 py-2 text-xs"
          >
            {preview ? "편집" : "미리보기"}
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => void save("draft")}
            className="rounded-[8px] border border-[rgba(244,241,234,0.12)] px-4 py-2 text-xs disabled:opacity-50"
          >
            임시저장
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => void save("scheduled")}
            className="rounded-[8px] border border-[rgba(244,241,234,0.12)] px-4 py-2 text-xs disabled:opacity-50"
          >
            예약
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => void save("published")}
            className="rounded-[8px] bg-[#FEE500] px-4 py-2 text-xs font-semibold text-[#191919] disabled:opacity-50"
          >
            발행
          </button>
          <Link
            href="/admin/magazine"
            className="rounded-[8px] border border-[rgba(244,241,234,0.12)] px-4 py-2 text-xs text-[#a8a49b]"
          >
            목록
          </Link>
        </div>
      </div>

      {error ? <p className="text-sm text-rose-400">{error}</p> : null}

      {preview ? (
        <div className="rounded-[12px] border border-[rgba(244,241,234,0.12)] bg-[#0a0a0a] p-6 sm:p-10">
          <p className="text-xs text-[#FEE500]">{category.toUpperCase()}</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight">{title || "제목"}</h1>
          <p className="mt-3 text-sm text-[#a8a49b]">{effectiveExcerpt}</p>
          <div className="mt-10">
            <MagazineBlockRenderer blocks={blocks} />
          </div>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-4">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="제목"
              className="w-full rounded-[8px] border border-[rgba(244,241,234,0.12)] bg-[rgba(244,241,234,0.05)] px-4 py-4 text-2xl font-bold text-[#f4f1ea] outline-none placeholder:text-[#6e6b65]"
            />
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value.slice(0, 120))}
              rows={2}
              placeholder="요약 (최대 120자 · 비우면 본문에서 자동)"
              className="w-full rounded-[8px] border border-[rgba(244,241,234,0.12)] bg-[rgba(244,241,234,0.05)] px-4 py-3 text-sm text-[#f4f1ea] outline-none"
            />
            <p className="text-[11px] text-[#6e6b65]">{effectiveExcerpt.length}/120</p>
            <MagazineBlockEditor
              blocks={blocks}
              onChange={setBlocks}
              uploading={uploading}
              onUploadImage={uploadImage}
            />
          </div>

          <aside className="space-y-4 rounded-[12px] border border-[rgba(244,241,234,0.12)] bg-[rgba(244,241,234,0.05)] p-4">
            <div>
              <p className="mb-2 text-[11px] font-medium text-[#a8a49b]">커버 이미지</p>
              {coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={coverUrl} alt="" className="mb-2 aspect-[16/10] w-full rounded-[8px] object-cover" />
              ) : null}
              <button
                type="button"
                disabled={uploading}
                onClick={() => {
                  const input = document.createElement("input");
                  input.type = "file";
                  input.accept = "image/*";
                  input.onchange = () => {
                    const f = input.files?.[0];
                    if (!f) return;
                    void uploadImage(f).then((url) => {
                      if (url) setCoverUrl(url);
                    });
                  };
                  input.click();
                }}
                className="flex aspect-[16/10] w-full items-center justify-center rounded-[8px] border border-dashed border-[rgba(244,241,234,0.25)] text-xs text-[#a8a49b]"
              >
                {coverUrl ? "커버 변경" : "클릭하여 커버 업로드 (1280×800 권장)"}
              </button>
              <input
                value={coverCredit}
                onChange={(e) => setCoverCredit(e.target.value)}
                placeholder="커버 출처"
                className="mt-2 w-full rounded-[8px] border border-[rgba(244,241,234,0.12)] bg-[#0a0a0a] px-3 py-2 text-xs outline-none"
              />
            </div>

            <div>
              <p className="mb-2 text-[11px] font-medium text-[#a8a49b]">슬러그 (URL)</p>
              <input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="비우면 제목에서 자동"
                className="w-full rounded-[8px] border border-[rgba(244,241,234,0.12)] bg-[#0a0a0a] px-3 py-2 text-xs outline-none"
              />
            </div>

            <div>
              <p className="mb-2 text-[11px] font-medium text-[#a8a49b]">분류</p>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as MagazineCategory)}
                className="w-full rounded-[8px] border border-[rgba(244,241,234,0.12)] bg-[#0a0a0a] px-3 py-2 text-sm outline-none"
              >
                <option value="culture">Culture</option>
                <option value="news">News</option>
              </select>
            </div>

            <div>
              <p className="mb-2 text-[11px] font-medium text-[#a8a49b]">해시태그 (최대 5개 · 직접 입력)</p>
              <div className="flex gap-2">
                <input
                  value={hashtagInput}
                  onChange={(e) => setHashtagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addHashtag();
                    }
                  }}
                  placeholder="# 없이 입력 후 Enter"
                  className="min-w-0 flex-1 rounded-[8px] border border-[rgba(244,241,234,0.12)] bg-[#0a0a0a] px-3 py-2 text-xs outline-none"
                />
                <button
                  type="button"
                  onClick={addHashtag}
                  className="rounded-[8px] border border-[rgba(244,241,234,0.12)] px-3 text-xs"
                >
                  추가
                </button>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {hashtags.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setHashtags(hashtags.filter((x) => x !== t))}
                    className="rounded-[6px] bg-[#FEE500] px-2 py-1 text-[10px] font-semibold text-[#191919]"
                  >
                    #{t} ×
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[11px] font-medium text-[#a8a49b]">크레딧</p>
              <input
                value={creditText}
                onChange={(e) => setCreditText(e.target.value)}
                placeholder="TEXT / EDITOR"
                className="w-full rounded-[8px] border border-[rgba(244,241,234,0.12)] bg-[#0a0a0a] px-3 py-2 text-xs outline-none"
              />
              <input
                value={creditPhoto}
                onChange={(e) => setCreditPhoto(e.target.value)}
                placeholder="PHOTO"
                className="w-full rounded-[8px] border border-[rgba(244,241,234,0.12)] bg-[#0a0a0a] px-3 py-2 text-xs outline-none"
              />
              <input
                value={creditEdit}
                onChange={(e) => setCreditEdit(e.target.value)}
                placeholder="EDIT"
                className="w-full rounded-[8px] border border-[rgba(244,241,234,0.12)] bg-[#0a0a0a] px-3 py-2 text-xs outline-none"
              />
            </div>

            <div className="space-y-2">
              <p className="text-[11px] font-medium text-[#a8a49b]">관련 링크</p>
              {relatedLinks.map((link, i) => (
                <div key={i} className="space-y-1 rounded-[8px] border border-[rgba(244,241,234,0.12)] p-2">
                  <input
                    value={link.label}
                    onChange={(e) => {
                      const next = [...relatedLinks];
                      next[i] = { ...next[i], label: e.target.value };
                      setRelatedLinks(next);
                    }}
                    placeholder="라벨"
                    className="w-full rounded bg-[#0a0a0a] px-2 py-1.5 text-xs outline-none"
                  />
                  <input
                    value={link.url}
                    onChange={(e) => {
                      const next = [...relatedLinks];
                      next[i] = { ...next[i], url: e.target.value };
                      setRelatedLinks(next);
                    }}
                    placeholder="https://"
                    className="w-full rounded bg-[#0a0a0a] px-2 py-1.5 text-xs outline-none"
                  />
                  <button
                    type="button"
                    className="text-[10px] text-rose-300"
                    onClick={() => setRelatedLinks(relatedLinks.filter((_, j) => j !== i))}
                  >
                    삭제
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setRelatedLinks([...relatedLinks, { label: "", url: "" }])}
                className="text-xs text-[#FEE500]"
              >
                + 링크 추가
              </button>
            </div>

            <label className="flex items-center justify-between gap-3 text-sm">
              <span>커버스토리 (메인 히어로 · 1개만)</span>
              <input
                type="checkbox"
                checked={isCoverStory}
                onChange={(e) => setIsCoverStory(e.target.checked)}
              />
            </label>
            <label className="flex items-center justify-between gap-3 text-sm">
              <span>MUSIC에 표기</span>
              <input
                type="checkbox"
                checked={showOnMusic}
                onChange={(e) => setShowOnMusic(e.target.checked)}
              />
            </label>

            <div>
              <p className="mb-2 text-[11px] font-medium text-[#a8a49b]">예약 발행</p>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="w-full rounded-[8px] border border-[rgba(244,241,234,0.12)] bg-[#0a0a0a] px-3 py-2 text-xs outline-none"
              />
            </div>

            <label className="flex items-start gap-2 text-xs text-[#a8a49b]">
              <input
                type="checkbox"
                checked={rightsOk}
                onChange={(e) => setRightsOk(e.target.checked)}
                className="mt-0.5"
              />
              사진·영상 사용 권한을 확인했습니다.
            </label>
            <label className="flex items-start gap-2 text-xs text-[#a8a49b]">
              <input
                type="checkbox"
                checked={originalOk}
                onChange={(e) => setOriginalOk(e.target.checked)}
                className="mt-0.5"
              />
              외부 기사 무단 복제가 아닌 원문입니다.
            </label>
          </aside>
        </div>
      )}
    </div>
  );
}
