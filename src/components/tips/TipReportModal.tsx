"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { TIP_MAX_ATTACHMENTS, TIP_MAX_IMAGE_BYTES, TIP_MAX_VIDEO_BYTES } from "@/lib/tips";

interface TipReportModalProps {
  onClose: () => void;
}

type AttachPreview = {
  id: string;
  file: File;
  url: string;
  kind: "image" | "video";
};

type PasteImage = {
  id: string;
  file: File;
};

function newId() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function TipReportModal({ onClose }: TipReportModalProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pasteMapRef = useRef<Map<string, File>>(new Map());

  const [title, setTitle] = useState("");
  const [attachments, setAttachments] = useState<AttachPreview[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting) onClose();
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose, submitting]);

  useEffect(() => {
    return () => {
      attachments.forEach((a) => URL.revokeObjectURL(a.url));
    };
  }, [attachments]);

  const totalFileCount = () => attachments.length + pasteMapRef.current.size;

  const addAttachmentFiles = useCallback((files: FileList | File[]) => {
    setError("");
    const list = Array.from(files);
    setAttachments((prev) => {
      const next = [...prev];
      for (const file of list) {
        if (next.length + pasteMapRef.current.size >= TIP_MAX_ATTACHMENTS) {
          setError(`파일은 최대 ${TIP_MAX_ATTACHMENTS}개까지입니다.`);
          break;
        }
        const isImage = file.type.startsWith("image/");
        const isVideo = file.type.startsWith("video/");
        if (!isImage && !isVideo) {
          setError("이미지 또는 동영상만 첨부할 수 있습니다.");
          continue;
        }
        if (isImage && file.size > TIP_MAX_IMAGE_BYTES) {
          setError("이미지는 파일당 10MB 이하여야 합니다.");
          continue;
        }
        if (isVideo && file.size > TIP_MAX_VIDEO_BYTES) {
          setError("동영상은 파일당 1GB 이하여야 합니다.");
          continue;
        }
        next.push({
          id: newId(),
          file,
          url: URL.createObjectURL(file),
          kind: isImage ? "image" : "video",
        });
      }
      return next;
    });
  }, []);

  const removeAttachment = (id: string) => {
    setAttachments((prev) => {
      const target = prev.find((a) => a.id === id);
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter((a) => a.id !== id);
    });
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    const imageFiles: File[] = [];
    for (const item of Array.from(items)) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) imageFiles.push(file);
      }
    }
    if (imageFiles.length === 0) return; // 텍스트 붙여넣기는 기본 동작

    e.preventDefault();
    setError("");

    for (const file of imageFiles) {
      if (totalFileCount() >= TIP_MAX_ATTACHMENTS) {
        setError(`파일은 최대 ${TIP_MAX_ATTACHMENTS}개까지입니다.`);
        break;
      }
      if (file.size > TIP_MAX_IMAGE_BYTES) {
        setError("붙여넣기 이미지는 10MB 이하여야 합니다.");
        continue;
      }
      const id = newId();
      pasteMapRef.current.set(id, file);
      const url = URL.createObjectURL(file);
      const img = document.createElement("img");
      img.src = url;
      img.alt = "";
      img.setAttribute("data-paste-id", id);
      img.style.maxWidth = "100%";
      img.style.height = "auto";
      img.style.display = "block";
      img.style.margin = "8px 0";

      const sel = window.getSelection();
      const editor = editorRef.current;
      if (!editor) continue;

      if (sel && sel.rangeCount > 0 && editor.contains(sel.anchorNode)) {
        const range = sel.getRangeAt(0);
        range.deleteContents();
        range.insertNode(img);
        range.setStartAfter(img);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
      } else {
        editor.appendChild(img);
      }
    }
  };

  const submit = async () => {
    setError("");
    const t = title.trim();
    if (!t) {
      setError("제목을 입력해주세요.");
      return;
    }
    const editor = editorRef.current;
    const contentHtml = editor?.innerHTML ?? "";
    const textOnly = (editor?.innerText ?? "").replace(/\u00a0/g, " ").trim();
    if (!textOnly && attachments.length === 0 && pasteMapRef.current.size === 0) {
      setError("내용 또는 첨부파일을 입력해주세요.");
      return;
    }

    setSubmitting(true);
    let tipId: string | null = null;

    type UploadSlot = {
      path: string;
      token: string;
      signedUrl: string;
      fileName: string;
      mimeType: string;
      kind: "image" | "video";
      pasteId?: string;
    };

    const parseJsonResponse = async (res: Response) => {
      const text = await res.text();
      try {
        return JSON.parse(text) as { message?: string; ok?: boolean; id?: string; uploads?: UploadSlot[] };
      } catch {
        if (text.includes("Request Entity Too Large") || text.includes("FUNCTION_PAYLOAD_TOO_LARGE")) {
          throw new Error("파일 크기가 서버 제한을 초과했습니다. 동영상은 1GB 이하 MP4(H.264)를 권장합니다.");
        }
        throw new Error("서버 응답을 처리할 수 없습니다. 잠시 후 다시 시도해주세요.");
      }
    };

    try {
      const pasteEntries: PasteImage[] = [];
      pasteMapRef.current.forEach((file, id) => {
        pasteEntries.push({ id, file });
      });

      const initRes = await fetch("/api/tips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: t,
          contentHtml,
          attachments: attachments.map((a) => ({
            name: a.file.name,
            mimeType: a.file.type,
            size: a.file.size,
          })),
          pasteImages: pasteEntries.map((p) => ({
            pasteId: p.id,
            name: p.file.name || `paste-${p.id}.png`,
            mimeType: p.file.type || "image/png",
            size: p.file.size,
          })),
        }),
      });
      const initJson = await parseJsonResponse(initRes);
      if (!initRes.ok) throw new Error(initJson.message || "제보에 실패했습니다.");

      tipId = initJson.id ?? null;
      const uploadSlots = initJson.uploads ?? [];

      if (uploadSlots.length > 0) {
        const supabase = createClient();
        const pasteById = new Map(pasteEntries.map((p) => [p.id, p.file]));
        const attachmentFiles = attachments.map((a) => a.file);
        let attachmentIdx = 0;

        for (const slot of uploadSlots) {
          const file = slot.pasteId
            ? pasteById.get(slot.pasteId)
            : attachmentFiles[attachmentIdx++];
          if (!file) throw new Error("첨부 파일을 찾을 수 없습니다.");

          const { error: upErr } = await supabase.storage
            .from("tips")
            .uploadToSignedUrl(slot.path, slot.token, file, { contentType: slot.mimeType });
          if (upErr) throw new Error(`파일 업로드 실패: ${upErr.message}`);
        }

        const completeRes = await fetch(`/api/tips/${tipId}/complete`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            uploads: uploadSlots.map((slot) => ({
              path: slot.path,
              fileName: slot.fileName,
              mimeType: slot.mimeType,
              kind: slot.kind,
              pasteId: slot.pasteId,
            })),
          }),
        });
        const completeJson = await parseJsonResponse(completeRes);
        if (!completeRes.ok) throw new Error(completeJson.message || "제보 완료 처리에 실패했습니다.");
      }

      setDone(true);
    } catch (err: unknown) {
      if (tipId) {
        await fetch(`/api/tips/${tipId}/abort`, { method: "POST" }).catch(() => {});
      }
      setError(err instanceof Error ? err.message : "제보에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={() => {
        if (!submitting) onClose();
      }}
    >
      <div
        className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto bg-background"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background px-5 py-4">
          <h2 className="text-sm font-medium uppercase tracking-wider">제보하기</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="text-xs text-muted transition-colors hover:text-foreground disabled:opacity-50"
          >
            닫기
          </button>
        </div>

        {done ? (
          <div className="px-5 py-10 text-center">
            <p className="text-sm font-medium">제보가 접수되었습니다.</p>
            <p className="mt-2 text-xs text-muted">일상 속 재미있는 순간을 보내 주셔서 감사합니다.</p>
            <button
              type="button"
              onClick={onClose}
              className="mt-8 border border-foreground bg-foreground px-6 py-2.5 text-[10px] uppercase tracking-widest text-background"
            >
              확인
            </button>
          </div>
        ) : (
          <div className="space-y-5 px-5 py-5">
            <p className="text-xs leading-relaxed text-muted">
              회원·비회원 누구나 제보할 수 있습니다. 사진·동영상을 첨부하거나, 본문에 이미지를
              붙여넣기(Ctrl/Cmd+V)할 수 있습니다.
            </p>

            <div>
              <label className="mb-1.5 block text-[10px] uppercase tracking-widest text-muted">
                제목 *
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={120}
                placeholder="제보 제목"
                className="w-full border border-border px-4 py-3 text-sm outline-none focus:border-foreground"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[10px] uppercase tracking-widest text-muted">
                내용 *
              </label>
              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onPaste={handlePaste}
                className="min-h-[160px] border border-border px-4 py-3 text-sm outline-none focus:border-foreground"
                style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
                aria-label="제보 내용"
              />
              <p className="mt-1 text-[10px] text-muted">
                카카오톡·웹에서 이미지를 복사한 뒤 본문에 붙여넣기(Ctrl/Cmd+V)할 수 있습니다.
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-[10px] uppercase tracking-widest text-muted">
                첨부파일 (이미지·동영상)
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) addAttachmentFiles(e.target.files);
                  e.target.value = "";
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="border border-border px-4 py-2 text-[10px] uppercase tracking-widest transition-colors hover:border-foreground"
              >
                파일 선택
              </button>
              {attachments.length > 0 && (
                <ul className="mt-3 space-y-2">
                  {attachments.map((a) => (
                    <li
                      key={a.id}
                      className="flex items-center gap-3 border border-border px-3 py-2 text-xs"
                    >
                      {a.kind === "image" ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={a.url} alt="" className="h-12 w-12 object-cover" />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center bg-neutral-100 text-[10px] text-muted">
                          VIDEO
                        </div>
                      )}
                      <span className="min-w-0 flex-1 truncate">{a.file.name}</span>
                      <button
                        type="button"
                        onClick={() => removeAttachment(a.id)}
                        className="text-muted underline hover:text-foreground"
                      >
                        제거
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {error ? <p className="text-sm text-red-600">{error}</p> : null}

            <button
              type="button"
              disabled={submitting}
              onClick={() => void submit()}
              className="w-full border border-foreground bg-foreground px-4 py-3 text-[10px] uppercase tracking-widest text-background disabled:opacity-50"
            >
              {submitting ? "전송 중…" : "제보완료"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
