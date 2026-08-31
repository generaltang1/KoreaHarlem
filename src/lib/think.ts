import type { User } from "@supabase/supabase-js";
import { maskIpForDisplay } from "@/lib/requestIp";

export type ThinkTab = "all" | "concept" | "notice";

export type ThinkAttachmentKind = "image" | "video" | "other";

export type ThinkPost = {
  id: string;
  title: string;
  content_html: string;
  user_id: string | null;
  author_nickname: string;
  author_ip: string;
  is_notice: boolean;
  recommend_count: number;
  view_count: number;
  created_at: string;
  updated_at: string;
};

export type ThinkAttachment = {
  id: string;
  post_id: string;
  file_url: string;
  file_name: string | null;
  mime_type: string | null;
  kind: ThinkAttachmentKind;
  sort_order: number;
};

export type ThinkYoutube = {
  id: string;
  post_id: string;
  video_id: string;
  title: string | null;
  channel_title: string | null;
  thumbnail_url: string | null;
  sort_order: number;
};

export type ThinkPostListItem = ThinkPost & {
  author_display: string;
  comment_count?: number;
};

export type ThinkPostDetail = ThinkPost & {
  author_display: string;
  attachments: ThinkAttachment[];
  youtube_videos: ThinkYoutube[];
};

export const THINK_CONCEPT_THRESHOLD = 20;
export const THINK_PAGE_SIZE = 50;
export const THINK_MAX_INLINE_IMAGES = 50;
export const THINK_MAX_VIDEO_ATTACHMENTS = 5;
/** @deprecated paste + video 합산 상한 — API 검증용 */
export const THINK_MAX_ATTACHMENTS = THINK_MAX_INLINE_IMAGES + THINK_MAX_VIDEO_ATTACHMENTS;
export const THINK_MAX_IMAGE_BYTES = 20 * 1024 * 1024;
export const THINK_MAX_VIDEO_BYTES = 100 * 1024 * 1024;
export const THINK_MAX_TITLE_LENGTH = 120;
export const THINK_MAX_CONTENT_LENGTH = 50000;
export const THINK_MAX_GUEST_NICKNAME = 10;
export const THINK_GUEST_DEFAULT_NICKNAME = "익명";

export type ThinkFileMeta = {
  name: string;
  mimeType: string;
  size: number;
};

export type ThinkPasteMeta = ThinkFileMeta & {
  pasteId: string;
};

export type ThinkYoutubeInput = {
  videoId: string;
  title?: string;
  channelTitle?: string;
  thumbnailUrl?: string;
};

export type ThinkUploadSlot = {
  path: string;
  token: string;
  signedUrl: string;
  fileName: string;
  mimeType: string;
  kind: "image" | "video";
  pasteId?: string;
};

export function thinkAttachmentKind(mime: string | null | undefined): ThinkAttachmentKind {
  const m = (mime ?? "").toLowerCase();
  if (m.startsWith("image/")) return "image";
  if (m.startsWith("video/")) return "video";
  return "other";
}

export function extFromThinkFileName(name: string, mime: string): string {
  const fromName = name.includes(".") ? name.split(".").pop()?.toLowerCase() : "";
  if (fromName && /^[a-z0-9]{1,8}$/.test(fromName)) return fromName;
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  if (mime === "image/gif") return "gif";
  if (mime === "video/mp4") return "mp4";
  if (mime === "video/webm") return "webm";
  if (mime === "video/quicktime") return "mov";
  return "bin";
}

export function validateThinkFileMeta(file: ThinkFileMeta): string | null {
  const kind = thinkAttachmentKind(file.mimeType);
  if (kind === "other") {
    return `"${file.name}"은(는) 이미지 또는 동영상만 첨부할 수 있습니다.`;
  }
  if (kind === "image" && file.size > THINK_MAX_IMAGE_BYTES) {
    return `이미지 "${file.name}"은(는) 20MB 이하여야 합니다.`;
  }
  if (kind === "video" && file.size > THINK_MAX_VIDEO_BYTES) {
    return `동영상 "${file.name}"은(는) 100MB 이하여야 합니다.`;
  }
  return null;
}

export function sanitizeThinkHtml(html: string): string {
  let out = html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/javascript:/gi, "");

  out = out.replace(
    /<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi,
    "",
  );

  out = out.replace(
    /<(?!\/?(?:p|br|div|span|b|strong|i|em|u|ul|ol|li|img|video|source)\b)[^>]+>/gi,
    "",
  );
  return out.trim();
}

export function getMemberNickname(user: User): string {
  const meta = user.user_metadata ?? {};
  const nickname =
    (meta.nickname as string) ||
    (meta.full_name as string) ||
    (meta.name as string) ||
    user.email?.split("@")[0];
  return (nickname ?? "회원").trim().slice(0, THINK_MAX_GUEST_NICKNAME) || "회원";
}

export function normalizeGuestNickname(input: string | null | undefined): string {
  const trimmed = (input ?? "").trim().slice(0, THINK_MAX_GUEST_NICKNAME);
  return trimmed || THINK_GUEST_DEFAULT_NICKNAME;
}

export function formatThinkAuthorDisplay(
  post: Pick<ThinkPost, "user_id" | "author_nickname" | "author_ip">,
): string {
  if (post.user_id) return post.author_nickname;
  return `${post.author_nickname}${maskIpForDisplay(post.author_ip)}`;
}

export function formatThinkDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  if (isToday) {
    const h = date.getHours().toString().padStart(2, "0");
    const m = date.getMinutes().toString().padStart(2, "0");
    return `${h}:${m}`;
  }

  const yy = (date.getFullYear() % 100).toString().padStart(2, "0");
  const mm = (date.getMonth() + 1).toString().padStart(2, "0");
  const dd = date.getDate().toString().padStart(2, "0");
  return `${yy}/${mm}/${dd}`;
}

export function isConceptPost(recommendCount: number, isNotice: boolean): boolean {
  return !isNotice && recommendCount >= THINK_CONCEPT_THRESHOLD;
}
