"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { THINK_MAX_IMAGE_BYTES } from "@/lib/think";

export type PendingImage = {
  id: string;
  file: File;
  url: string;
};

type ThinkImageUploadModalProps = {
  onClose: () => void;
  onApply: (files: File[]) => void;
  maxTotal: number;
  currentCount: number;
};

function newId() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function ThinkImageUploadModal({
  onClose,
  onApply,
  maxTotal,
  currentCount,
}: ThinkImageUploadModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<PendingImage[]>([]);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const remaining = maxTotal - currentCount;

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  useEffect(() => {
    return () => {
      pending.forEach((p) => URL.revokeObjectURL(p.url));
    };
  }, [pending]);

  const addFiles = useCallback(
    (files: FileList | File[]) => {
      setError("");
      const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
      if (list.length === 0) {
        setError("이미지 파일만 선택할 수 있습니다.");
        return;
      }

      setPending((prev) => {
        const next = [...prev];
        for (const file of list) {
          if (currentCount + next.length >= maxTotal) {
            setError(`이미지는 최대 ${maxTotal}개까지입니다.`);
            break;
          }
          if (file.size > THINK_MAX_IMAGE_BYTES) {
            setError(`"${file.name}"은(는) 20MB 이하여야 합니다.`);
            continue;
          }
          next.push({ id: newId(), file, url: URL.createObjectURL(file) });
        }
        return next;
      });
    },
    [currentCount, maxTotal],
  );

  const removePending = (id: string) => {
    setPending((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter((p) => p.id !== id);
    });
  };

  const handleApply = () => {
    if (pending.length === 0) {
      setError("추가할 이미지를 선택해주세요.");
      return;
    }
    onApply(pending.map((p) => p.file));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={onClose}>
      <div
        className="flex max-h-[90vh] w-full max-w-lg flex-col bg-background"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-foreground px-4 py-3 text-sm font-medium text-background">이미지 업로드 하기</div>

        <div className="flex-1 overflow-y-auto p-4">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={remaining <= pending.length}
            className="mb-4 flex items-center gap-2 border border-border px-3 py-2 text-xs hover:bg-neutral-50 disabled:opacity-50"
          >
            <span className="text-lg leading-none">+</span> 이미지 추가
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files) addFiles(e.target.files);
              e.target.value = "";
            }}
          />

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
            }}
            className={`min-h-[160px] border-2 border-dashed p-6 text-center transition-colors ${
              dragOver ? "border-foreground bg-neutral-50" : "border-border"
            }`}
          >
            {pending.length === 0 ? (
              <div className="text-muted">
                <p className="text-sm">이미지 쉽게 올리기</p>
                <p className="mt-2 text-xs">
                  이미지를 드래그&amp;드롭으로 이곳에 올려주시면 됩니다.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {pending.map((item) => (
                  <div key={item.id} className="group relative aspect-square overflow-hidden border border-border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.url} alt="" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removePending(item.id)}
                      className="absolute right-1 top-1 bg-black/60 px-1.5 py-0.5 text-[10px] text-white opacity-0 group-hover:opacity-100"
                    >
                      삭제
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <p className="mt-4 text-[10px] leading-relaxed text-muted">
            이미지 파일은 각각 최대 20MB, 총 {maxTotal}개까지 업로드 가능합니다.
            적용을 누르면 글쓰기 본문에 삽입됩니다.
          </p>
          {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
        </div>

        <div className="border-t border-border p-4 text-center">
          <button
            type="button"
            onClick={handleApply}
            className="bg-foreground px-10 py-2.5 text-sm text-background"
          >
            적용
          </button>
        </div>
      </div>
    </div>
  );
}
