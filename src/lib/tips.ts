export type TipAttachmentKind = "image" | "video" | "other";

export type TipAttachment = {
  id: string;
  tip_id: string;
  file_url: string;
  file_name: string | null;
  mime_type: string | null;
  kind: TipAttachmentKind;
  sort_order: number;
  created_at: string;
};

export type TipReport = {
  id: string;
  title: string;
  content_html: string;
  user_id: string | null;
  created_at: string;
};

export type TipReportWithAttachments = TipReport & {
  attachments: TipAttachment[];
};

export const TIP_MAX_ATTACHMENTS = 10;
export const TIP_MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10MB
export const TIP_MAX_VIDEO_BYTES = 1024 * 1024 * 1024; // 1GB
export const TIP_MAX_TITLE_LENGTH = 120;
export const TIP_MAX_CONTENT_LENGTH = 20000;

export function tipAttachmentKind(mime: string | null | undefined): TipAttachmentKind {
  const m = (mime ?? "").toLowerCase();
  if (m.startsWith("image/")) return "image";
  if (m.startsWith("video/")) return "video";
  return "other";
}

export type TipFileMeta = {
  name: string;
  mimeType: string;
  size: number;
};

export type TipPasteMeta = TipFileMeta & {
  pasteId: string;
};

export type TipUploadSlot = {
  path: string;
  token: string;
  signedUrl: string;
  fileName: string;
  mimeType: string;
  kind: "image" | "video";
  pasteId?: string;
};

export function extFromTipFileName(name: string, mime: string): string {
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

export function validateTipFileMeta(file: TipFileMeta): string | null {
  const kind = tipAttachmentKind(file.mimeType);
  if (kind === "other") {
    return `"${file.name}"은(는) 이미지 또는 동영상만 첨부할 수 있습니다.`;
  }
  if (kind === "image" && file.size > TIP_MAX_IMAGE_BYTES) {
    return `이미지 "${file.name}"은(는) 10MB 이하여야 합니다.`;
  }
  if (kind === "video" && file.size > TIP_MAX_VIDEO_BYTES) {
    return `동영상 "${file.name}"은(는) 1GB 이하여야 합니다.`;
  }
  return null;
}

/** 관리자 표시용: script 등 제거한 단순 화이트리스트 */
export function sanitizeTipHtml(html: string): string {
  let out = html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi, "")
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/javascript:/gi, "");

  // 허용 태그 외 strip은 과도할 수 있어 위험 속성만 제거
  out = out.replace(/<(?!\/?(?:p|br|div|span|b|strong|i|em|u|ul|ol|li|img)\b)[^>]+>/gi, "");
  return out.trim();
}
