"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  THINK_MAX_GUEST_NICKNAME,
  THINK_MAX_INLINE_IMAGES,
  THINK_MAX_VIDEO_ATTACHMENTS,
  THINK_MAX_VIDEO_BYTES,
  ThinkYoutubeInput,
} from "@/lib/think";
import {
  editorHasContent,
  insertInlineImages,
  saveEditorSelection,
} from "@/lib/thinkEditor";
import { ThinkImageUploadModal } from "@/components/think/ThinkImageUploadModal";
import { YouTubeSearchModal } from "@/components/think/YouTubeSearchModal";

type VideoAttachPreview = {
  id: string;
  file: File;
  url: string;
};

type PasteImage = { id: string; file: File };

function newId() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

type ThinkPostEditorProps = {
  isAdmin?: boolean;
  isLoggedIn?: boolean;
  memberNickname?: string;
  onSuccess?: (postId: string) => void;
};

export function ThinkPostEditor({
  isAdmin = false,
  isLoggedIn = false,
  memberNickname,
  onSuccess,
}: ThinkPostEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const pasteMapRef = useRef<Map<string, File>>(new Map());
  const savedRangeRef = useRef<Range | null>(null);

  const [title, setTitle] = useState("");
  const [guestNickname, setGuestNickname] = useState("");
  const [isNotice, setIsNotice] = useState(false);
  const [videoAttachments, setVideoAttachments] = useState<VideoAttachPreview[]>([]);
  const [youtubeVideos, setYoutubeVideos] = useState<ThinkYoutubeInput[]>([]);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [youtubeOpen, setYoutubeOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    return () => {
      videoAttachments.forEach((a) => URL.revokeObjectURL(a.url));
    };
  }, [videoAttachments]);

  const inlineImageCount = () => pasteMapRef.current.size;

  const openImageModal = () => {
    savedRangeRef.current = saveEditorSelection(editorRef.current);
    setImageModalOpen(true);
  };

  const handleImageApply = (files: File[]) => {
    const editor = editorRef.current;
    if (!editor) return;
    setError("");
    insertInlineImages(editor, files, pasteMapRef.current, savedRangeRef.current, {
      maxTotal: THINK_MAX_INLINE_IMAGES,
      onError: setError,
    });
    savedRangeRef.current = null;
  };

  const addVideoFiles = useCallback((files: FileList | File[]) => {
    setError("");
    const list = Array.from(files);
    setVideoAttachments((prev) => {
      const next = [...prev];
      for (const file of list) {
        if (next.length >= THINK_MAX_VIDEO_ATTACHMENTS) {
          setError(`동영상은 최대 ${THINK_MAX_VIDEO_ATTACHMENTS}개까지입니다.`);
          break;
        }
        if (!file.type.startsWith("video/")) {
          setError("동영상 파일만 첨부할 수 있습니다.");
          continue;
        }
        if (file.size > THINK_MAX_VIDEO_BYTES) {
          setError("동영상은 파일당 100MB 이하여야 합니다.");
          continue;
        }
        next.push({ id: newId(), file, url: URL.createObjectURL(file) });
      }
      return next;
    });
  }, []);

  const removeVideo = (id: string) => {
    setVideoAttachments((prev) => {
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
    const editor = editorRef.current;
    if (!editor) return;

    const range = saveEditorSelection(editor);
    insertInlineImages(editor, imageFiles, pasteMapRef.current, range, {
      maxTotal: THINK_MAX_INLINE_IMAGES,
      onError: setError,
    });
  };

  const submit = async () => {
    setError("");
    const t = title.trim();
    if (!t) {
      setError("제목을 입력해주세요.");
      return;
    }
    const editor = editorRef.current;
    if (!editorHasContent(editor) && videoAttachments.length === 0 && youtubeVideos.length === 0) {
      setError("내용 또는 첨부를 입력해주세요.");
      return;
    }

    const contentHtml = editor?.innerHTML ?? "";

    setSubmitting(true);
    let postId: string | null = null;

    type UploadSlot = {
      path: string;
      token: string;
      signedUrl: string;
      fileName: string;
      mimeType: string;
      kind: "image" | "video";
      pasteId?: string;
    };

    try {
      const pasteEntries: PasteImage[] = [];
      pasteMapRef.current.forEach((file, id) => pasteEntries.push({ id, file }));

      const initRes = await fetch("/api/think/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: t,
          contentHtml,
          guestNickname: isLoggedIn ? undefined : guestNickname,
          isNotice: isAdmin && isNotice,
          attachments: videoAttachments.map((a) => ({
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
          youtubeVideos,
        }),
      });
      const initJson = (await initRes.json()) as {
        message?: string;
        id?: string;
        uploads?: UploadSlot[];
      };
      if (!initRes.ok) throw new Error(initJson.message || "등록에 실패했습니다.");

      postId = initJson.id ?? null;
      const uploadSlots = initJson.uploads ?? [];

      if (uploadSlots.length > 0 && postId) {
        const supabase = createClient();
        const pasteById = new Map(pasteEntries.map((p) => [p.id, p.file]));
        const videoFiles = videoAttachments.map((a) => a.file);
        let videoIdx = 0;

        for (const slot of uploadSlots) {
          const file = slot.pasteId ? pasteById.get(slot.pasteId) : videoFiles[videoIdx++];
          if (!file) throw new Error("첨부 파일을 찾을 수 없습니다.");
          const { error: upErr } = await supabase.storage
            .from("think")
            .uploadToSignedUrl(slot.path, slot.token, file, { contentType: slot.mimeType });
          if (upErr) throw new Error(`파일 업로드 실패: ${upErr.message}`);
        }

        const completeRes = await fetch(`/api/think/posts/${postId}/complete`, {
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
        const completeJson = (await completeRes.json()) as { message?: string };
        if (!completeRes.ok) throw new Error(completeJson.message || "완료 처리에 실패했습니다.");
      }

      onSuccess?.(postId!);
    } catch (err: unknown) {
      if (postId) {
        await fetch(`/api/think/posts/${postId}/abort`, { method: "POST" }).catch(() => {});
      }
      setError(err instanceof Error ? err.message : "등록에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="border border-border bg-background">
      <div className="border-b border-border bg-neutral-50 px-4 py-3">
        <h1 className="text-sm font-semibold">글쓰기</h1>
      </div>

      <div className="space-y-4 p-4 md:p-6">
        {!isLoggedIn && (
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-xs text-muted">닉네임</label>
            <input
              value={guestNickname}
              onChange={(e) => setGuestNickname(e.target.value.slice(0, THINK_MAX_GUEST_NICKNAME))}
              maxLength={THINK_MAX_GUEST_NICKNAME}
              placeholder="미입력 시 익명"
              className="w-40 border border-border px-3 py-2 text-sm outline-none focus:border-foreground"
            />
            <span className="text-[10px] text-muted">비회원 · 최대 {THINK_MAX_GUEST_NICKNAME}자 · IP 일부 공개</span>
          </div>
        )}

        {isLoggedIn && memberNickname && (
          <p className="text-xs text-muted">
            작성자: <span className="text-foreground">{memberNickname}</span>
          </p>
        )}

        {isAdmin && (
          <label className="flex items-center gap-2 text-xs">
            <input type="checkbox" checked={isNotice} onChange={(e) => setIsNotice(e.target.checked)} />
            공지로 등록
          </label>
        )}

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={120}
          placeholder="제목을 입력해 주세요"
          className="w-full border border-border px-4 py-3 text-sm outline-none focus:border-foreground"
        />

        <div className="flex flex-wrap gap-2 border border-border bg-neutral-50 px-3 py-2">
          <button
            type="button"
            onClick={openImageModal}
            className="border border-border bg-background px-3 py-1.5 text-xs hover:bg-neutral-100"
          >
            이미지
          </button>
          <button
            type="button"
            onClick={() => videoInputRef.current?.click()}
            className="border border-border bg-background px-3 py-1.5 text-xs hover:bg-neutral-100"
          >
            동영상
          </button>
          <button
            type="button"
            onClick={() => setYoutubeOpen(true)}
            className="border border-border bg-background px-3 py-1.5 text-xs hover:bg-neutral-100"
          >
            유튜브
          </button>
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files) addVideoFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </div>

        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onPaste={handlePaste}
          onClick={() => {
            savedRangeRef.current = saveEditorSelection(editorRef.current);
          }}
          onKeyUp={() => {
            savedRangeRef.current = saveEditorSelection(editorRef.current);
          }}
          className="min-h-[320px] border border-border px-4 py-3 text-sm leading-relaxed outline-none focus:border-foreground [&:empty]:before:pointer-events-none [&:empty]:before:text-muted [&:empty]:before:content-['본문을_입력하세요._이미지는_글_사이사이에_넣을_수_있습니다.']"
          style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
          aria-label="본문"
        />

        <p className="text-[10px] text-muted">
          이미지는 본문에 삽입됩니다 · 외부 캡처/복사 붙여넣기(Ctrl/Cmd+V) · 이미지 20MB · 동영상 100MB
        </p>

        {youtubeVideos.length > 0 && (
          <ul className="space-y-2">
            {youtubeVideos.map((v) => (
              <li key={v.videoId} className="flex items-center gap-3 border border-border p-2 text-xs">
                {v.thumbnailUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={v.thumbnailUrl} alt="" className="h-12 w-20 object-cover" />
                )}
                <span className="min-w-0 flex-1 truncate">{v.title}</span>
                <button
                  type="button"
                  onClick={() => setYoutubeVideos((prev) => prev.filter((x) => x.videoId !== v.videoId))}
                  className="text-muted underline"
                >
                  제거
                </button>
              </li>
            ))}
          </ul>
        )}

        {videoAttachments.length > 0 && (
          <ul className="space-y-2">
            {videoAttachments.map((a) => (
              <li key={a.id} className="flex items-center gap-3 border border-border px-3 py-2 text-xs">
                <div className="flex h-12 w-12 items-center justify-center bg-neutral-100 text-[10px]">VIDEO</div>
                <span className="min-w-0 flex-1 truncate">{a.file.name}</span>
                <button type="button" onClick={() => removeVideo(a.id)} className="text-muted underline">
                  제거
                </button>
              </li>
            ))}
          </ul>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            disabled={submitting}
            onClick={() => void submit()}
            className="bg-foreground px-8 py-2.5 text-xs uppercase tracking-widest text-background disabled:opacity-50"
          >
            {submitting ? "등록 중…" : "등록"}
          </button>
        </div>
      </div>

      {imageModalOpen && (
        <ThinkImageUploadModal
          onClose={() => setImageModalOpen(false)}
          onApply={handleImageApply}
          maxTotal={THINK_MAX_INLINE_IMAGES}
          currentCount={inlineImageCount()}
        />
      )}

      {youtubeOpen && (
        <YouTubeSearchModal
          onClose={() => setYoutubeOpen(false)}
          onSelect={(video) => {
            setYoutubeVideos((prev) => {
              if (prev.some((v) => v.videoId === video.videoId)) return prev;
              return [...prev, video];
            });
            setYoutubeOpen(false);
          }}
        />
      )}
    </div>
  );
}
