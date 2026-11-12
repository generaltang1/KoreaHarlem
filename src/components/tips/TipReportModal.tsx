"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { TIP_MAX_ATTACHMENTS, TIP_MAX_IMAGE_BYTES, TIP_MAX_VIDEO_BYTES } from "@/lib/tips";
import { site } from "@/lib/siteTheme";

interface TipReportModalProps {
  onClose: () => void;
}

type AttachPreview = {
  id: string;
  file: File;
  url: string;
  kind: "image" | "video";
};

function newId() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const inputClass = site.input;

export function TipReportModal({ onClose }: TipReportModalProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pasteMapRef = useRef<Map<string, File>>(new Map());

  const [title, setTitle] = useState("");
  const [instagram, setInstagram] = useState("");
  const [password, setPassword] = useState("");
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
    if (imageFiles.length === 0) return;

    e.preventDefault();
    setError("");

    for (const file of imageFiles) {
      if (totalFileCount() >= TIP_MAX_ATTACHMENTS) {
        setError(`파일은 최대 ${TIP_MAX_ATTACHMENTS}개까지입니다.`);
        break;
      }
      if (file.size > TIP_MAX_IMAGE_BYTES) {
        setError("이미지는 파일당 10MB 이하여야 합니다.");
        continue;
      }
      const id = newId();
      pasteMapRef.current.set(id, file);
      const url = URL.createObjectURL(file);
      const img = document.createElement("img");
      img.src = url;
      img.alt = "붙여넣기 이미지";
      img.dataset.pasteId = id;
      img.className = "max-h-48 max-w-full rounded-[8px]";
      const sel = window.getSelection();
      if (sel?.rangeCount) {
        const range = sel.getRangeAt(0);
        range.deleteContents();
        range.insertNode(img);
        range.setStartAfter(img);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
      } else {
        editorRef.current?.appendChild(img);
      }
    }
  };

  async function parseJsonResponse(res: Response) {
    try {
      return await res.json();
    } catch {
      return {};
    }
  }

  const submit = async () => {
    setError("");
    const t = title.trim();
    if (!t) {
      setError("제목을 입력해주세요.");
      return;
    }
    if (password.trim().length < 4) {
      setError("수정·삭제용 비밀번호를 4자 이상 입력해주세요.");
      return;
    }

    const contentHtml = editorRef.current?.innerHTML ?? "";
    const textOnly = contentHtml.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").trim();
    if (!textOnly && attachments.length === 0 && pasteMapRef.current.size === 0) {
      setError("내용 또는 첨부파일을 입력해주세요.");
      return;
    }

    setSubmitting(true);
    let tipId: string | null = null;

    try {
      const pasteEntries: { id: string; file: File }[] = [];
      pasteMapRef.current.forEach((file, id) => {
        pasteEntries.push({ id, file });
      });

      const initRes = await fetch("/api/tips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: t,
          contentHtml,
          instagramHandle: instagram.trim(),
          accessPassword: password.trim(),
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
            uploads: uploadSlots.map((slot: { path: string; fileName: string; mimeType: string; kind: string; pasteId?: string }) => ({
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
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 px-4"
      onClick={() => {
        if (!submitting) onClose();
      }}
    >
      <div
        className={`relative max-h-[90vh] w-full max-w-[560px] overflow-y-auto text-[#f4f1ea] ${site.glassModal} ${site.font}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-[20px] border-b border-[rgba(244,241,234,0.12)] bg-[#141414]/95 px-6 py-5 backdrop-blur-[10px]">
          <h2 className="text-xl font-bold tracking-tight">제보하기</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="flex h-8 w-8 items-center justify-center rounded-[8px] text-[#a8a49b] transition-colors hover:bg-[rgba(244,241,234,0.06)] hover:text-[#f4f1ea] disabled:opacity-50"
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        {done ? (
          <div className="px-6 py-12 text-center">
            <p className="text-base font-semibold">제보가 접수되었습니다.</p>
            <p className={`mt-2 text-sm ${site.muted}`}>
              일상 속 재미있는 순간을 보내 주셔서 감사합니다.
            </p>
            <button
              type="button"
              onClick={onClose}
              className={`mt-8 w-full ${site.creamBtn}`}
            >
              확인
            </button>
          </div>
        ) : (
          <div className="space-y-5 px-6 py-5">
            <ul className="space-y-1.5 rounded-[8px] bg-[#FEE500] px-4 py-3.5 text-[13px] leading-relaxed text-[#191919]">
              <li className="flex gap-2">
                <span aria-hidden>•</span>
                <span>제보한 내용은 안전하게 정리돼요.</span>
              </li>
              <li className="flex gap-2">
                <span aria-hidden>•</span>
                <span>기본은 익명이에요. 인스타그램 아이디를 남기면 게시물에 언급해드릴 수 있어요.</span>
              </li>
              <li className="flex gap-2">
                <span aria-hidden>•</span>
                <span>로그인 없이도 제보할 수 있어요.</span>
              </li>
            </ul>

            <div>
              <label className={site.label}>제목</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={120}
                placeholder="제보 제목"
                className={inputClass}
              />
            </div>

            <div>
              <label className={site.label}>내용</label>
              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onPaste={handlePaste}
                data-placeholder="제보할 내용을 적어주세요"
                className="min-h-[120px] rounded-[8px] border border-[rgba(244,241,234,0.12)] bg-[rgba(244,241,234,0.05)] px-3.5 py-3 text-sm text-[#f4f1ea] outline-none empty:before:text-[#6e6b65] empty:before:content-[attr(data-placeholder)] focus:border-[rgba(244,241,234,0.35)]"
                style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
                aria-label="제보 내용"
              />
              <p className="mt-1 text-[10px] text-[#6e6b65]">
                카카오톡·웹에서 이미지를 복사한 뒤 본문에 붙여넣기(Ctrl/Cmd+V)할 수 있습니다.
              </p>
            </div>

            <div>
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
                className="flex w-full items-center gap-3 rounded-[12px] border border-dashed border-[rgba(244,241,234,0.25)] bg-[rgba(244,241,234,0.05)] px-4 py-4 text-left transition-colors hover:border-[rgba(244,241,234,0.45)] hover:bg-[rgba(244,241,234,0.08)]"
              >
                <span className="text-lg text-[#a8a49b]">↑</span>
                <span>
                  <span className="block text-sm text-[#f4f1ea]">이미지 · 영상 첨부</span>
                  <span className="mt-0.5 block text-[11px] text-[#6e6b65]">파일당 최대 1GB</span>
                </span>
              </button>
              {attachments.length > 0 && (
                <ul className="mt-3 space-y-2">
                  {attachments.map((a) => (
                    <li
                      key={a.id}
                      className="flex items-center gap-3 rounded-[8px] border border-[rgba(244,241,234,0.12)] bg-[rgba(244,241,234,0.05)] px-3 py-2 text-xs"
                    >
                      {a.kind === "image" ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={a.url} alt="" className="h-12 w-12 rounded-[6px] object-cover" />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-[6px] bg-[rgba(244,241,234,0.08)] text-[10px] text-[#6e6b65]">
                          VIDEO
                        </div>
                      )}
                      <span className="min-w-0 flex-1 truncate text-[#f4f1ea]">{a.file.name}</span>
                      <button
                        type="button"
                        onClick={() => removeAttachment(a.id)}
                        className="text-[#6e6b65] underline hover:text-[#f4f1ea]"
                      >
                        제거
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={site.label}>
                  인스타그램 아이디 (선택)
                </label>
                <input
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="@koreaharlem"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={site.label}>비밀번호</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="수정 · 삭제용"
                  className={inputClass}
                  autoComplete="new-password"
                />
              </div>
            </div>

            {error ? <p className="text-sm text-rose-400">{error}</p> : null}

            <button
              type="button"
              disabled={submitting}
              onClick={() => void submit()}
              className={`w-full ${site.creamBtn}`}
            >
              {submitting ? "전송 중…" : "제보 보내기"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
