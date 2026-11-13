"use client";

import { useRef } from "react";
import {
  createEmptyBlock,
  type MagazineBlock,
  type MagazineBlockType,
} from "@/lib/magazineBlocks";

const TOOLS: { type: MagazineBlockType; label: string }[] = [
  { type: "paragraph", label: "본문" },
  { type: "heading", label: "소제목" },
  { type: "quote", label: "인용" },
  { type: "image", label: "이미지" },
  { type: "youtube", label: "유튜브" },
  { type: "link", label: "링크" },
  { type: "divider", label: "구분선" },
  { type: "code", label: "가사/코드" },
];

export function MagazineBlockEditor({
  blocks,
  onChange,
  uploading,
  onUploadImage,
}: {
  blocks: MagazineBlock[];
  onChange: (next: MagazineBlock[]) => void;
  uploading?: boolean;
  onUploadImage: (file: File) => Promise<string | null>;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const pendingImageIndex = useRef<number | null>(null);

  const update = (id: string, patch: Partial<MagazineBlock>) => {
    onChange(blocks.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  };

  const remove = (id: string) => {
    if (blocks.length <= 1) {
      onChange([createEmptyBlock("paragraph")]);
      return;
    }
    onChange(blocks.filter((b) => b.id !== id));
  };

  const move = (index: number, dir: -1 | 1) => {
    const next = index + dir;
    if (next < 0 || next >= blocks.length) return;
    const copy = [...blocks];
    const tmp = copy[index];
    copy[index] = copy[next];
    copy[next] = tmp;
    onChange(copy);
  };

  const add = (type: MagazineBlockType) => {
    if (type === "image") {
      pendingImageIndex.current = blocks.length;
      onChange([...blocks, createEmptyBlock("image")]);
      fileRef.current?.click();
      return;
    }
    onChange([...blocks, createEmptyBlock(type)]);
  };

  const onPickFile = async (file: File | null) => {
    if (!file) return;
    const url = await onUploadImage(file);
    const idx = pendingImageIndex.current;
    pendingImageIndex.current = null;
    if (!url || idx == null) return;
    onChange(
      blocks.map((b, i) => (i === idx ? { ...b, type: "image", url } : b)),
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 rounded-[8px] border border-[rgba(244,241,234,0.12)] bg-[rgba(244,241,234,0.05)] p-2">
        {TOOLS.map((t) => (
          <button
            key={t.type}
            type="button"
            onClick={() => add(t.type)}
            className="rounded-[6px] border border-[rgba(244,241,234,0.12)] px-3 py-1.5 text-xs text-[#f4f1ea] transition-colors hover:bg-[rgba(244,241,234,0.08)]"
          >
            {t.label}
          </button>
        ))}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0] ?? null;
          e.target.value = "";
          void onPickFile(f);
        }}
      />

      <div className="space-y-4">
        {blocks.map((block, index) => (
          <div
            key={block.id}
            className="rounded-[12px] border border-[rgba(244,241,234,0.12)] bg-[rgba(244,241,234,0.03)] p-4"
          >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <span className="text-[10px] uppercase tracking-widest text-[#6e6b65]">
                {TOOLS.find((t) => t.type === block.type)?.label ?? block.type}
              </span>
              <div className="flex gap-1">
                <button
                  type="button"
                  className="rounded px-2 py-1 text-xs text-[#a8a49b] hover:text-white"
                  onClick={() => move(index, -1)}
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="rounded px-2 py-1 text-xs text-[#a8a49b] hover:text-white"
                  onClick={() => move(index, 1)}
                >
                  ↓
                </button>
                <button
                  type="button"
                  className="rounded px-2 py-1 text-xs text-rose-300 hover:text-rose-200"
                  onClick={() => remove(block.id)}
                >
                  삭제
                </button>
              </div>
            </div>

            {block.type === "paragraph" || block.type === "heading" ? (
              <textarea
                value={block.text ?? ""}
                onChange={(e) => update(block.id, { text: e.target.value })}
                rows={block.type === "heading" ? 2 : 5}
                placeholder={
                  block.type === "heading"
                    ? "소제목"
                    : "본문 단락을 작성하세요"
                }
                className="w-full rounded-[8px] border border-[rgba(244,241,234,0.12)] bg-[#0a0a0a] px-3 py-3 text-sm text-[#f4f1ea] outline-none placeholder:text-[#6e6b65] focus:border-[rgba(244,241,234,0.35)]"
              />
            ) : null}

            {block.type === "quote" ? (
              <div className="space-y-2">
                <textarea
                  value={block.text ?? ""}
                  onChange={(e) => update(block.id, { text: e.target.value })}
                  rows={3}
                  placeholder="인용문"
                  className="w-full rounded-[8px] border border-[rgba(244,241,234,0.12)] bg-[#0a0a0a] px-3 py-3 text-sm text-[#f4f1ea] outline-none"
                />
                <input
                  value={block.credit ?? ""}
                  onChange={(e) => update(block.id, { credit: e.target.value })}
                  placeholder="화자 · 출처"
                  className="w-full rounded-[8px] border border-[rgba(244,241,234,0.12)] bg-[#0a0a0a] px-3 py-2 text-sm text-[#f4f1ea] outline-none"
                />
              </div>
            ) : null}

            {block.type === "image" ? (
              <div className="space-y-3">
                {block.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={block.url}
                    alt=""
                    className="max-h-64 w-full rounded-[8px] object-cover"
                  />
                ) : (
                  <button
                    type="button"
                    disabled={uploading}
                    onClick={() => {
                      pendingImageIndex.current = index;
                      fileRef.current?.click();
                    }}
                    className="flex aspect-[16/9] w-full items-center justify-center rounded-[8px] border border-dashed border-[rgba(244,241,234,0.25)] text-sm text-[#a8a49b] hover:border-[#FEE500]"
                  >
                    {uploading ? "업로드 중…" : "클릭하여 이미지 업로드"}
                  </button>
                )}
                <input
                  value={block.caption ?? ""}
                  onChange={(e) => update(block.id, { caption: e.target.value })}
                  placeholder="사진 설명"
                  className="w-full rounded-[8px] border border-[rgba(244,241,234,0.12)] bg-[#0a0a0a] px-3 py-2 text-sm text-[#f4f1ea] outline-none"
                />
                <input
                  value={block.credit ?? ""}
                  onChange={(e) => update(block.id, { credit: e.target.value })}
                  placeholder="PHOTO / 출처"
                  className="w-full rounded-[8px] border border-[rgba(244,241,234,0.12)] bg-[#0a0a0a] px-3 py-2 text-sm text-[#f4f1ea] outline-none"
                />
              </div>
            ) : null}

            {block.type === "youtube" ? (
              <input
                value={block.url ?? ""}
                onChange={(e) => update(block.id, { url: e.target.value })}
                placeholder="YouTube URL (youtube.com / youtu.be)"
                className="w-full rounded-[8px] border border-[rgba(244,241,234,0.12)] bg-[#0a0a0a] px-3 py-2 text-sm text-[#f4f1ea] outline-none"
              />
            ) : null}

            {block.type === "link" ? (
              <div className="space-y-2">
                <input
                  value={block.label ?? ""}
                  onChange={(e) => update(block.id, { label: e.target.value })}
                  placeholder="링크 라벨 (LISTEN · Ticket · Shop)"
                  className="w-full rounded-[8px] border border-[rgba(244,241,234,0.12)] bg-[#0a0a0a] px-3 py-2 text-sm text-[#f4f1ea] outline-none"
                />
                <input
                  value={block.url ?? ""}
                  onChange={(e) => update(block.id, { url: e.target.value })}
                  placeholder="https://"
                  className="w-full rounded-[8px] border border-[rgba(244,241,234,0.12)] bg-[#0a0a0a] px-3 py-2 text-sm text-[#f4f1ea] outline-none"
                />
              </div>
            ) : null}

            {block.type === "divider" ? (
              <div className="border-t border-[rgba(244,241,234,0.12)] py-2 text-center text-xs text-[#6e6b65]">
                구분선
              </div>
            ) : null}

            {block.type === "code" ? (
              <div className="space-y-2">
                <textarea
                  value={block.text ?? ""}
                  onChange={(e) => update(block.id, { text: e.target.value })}
                  rows={6}
                  placeholder="가사 · 코드 · 원문 텍스트"
                  className="w-full rounded-[8px] border border-[rgba(244,241,234,0.12)] bg-[#0a0a0a] px-3 py-3 font-mono text-[13px] text-[#f4f1ea] outline-none"
                />
                <input
                  value={block.caption ?? ""}
                  onChange={(e) => update(block.id, { caption: e.target.value })}
                  placeholder="캡션 (선택)"
                  className="w-full rounded-[8px] border border-[rgba(244,241,234,0.12)] bg-[#0a0a0a] px-3 py-2 text-sm text-[#f4f1ea] outline-none"
                />
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
