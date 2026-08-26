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
export const TIP_MAX_VIDEO_BYTES = 100 * 1024 * 1024; // 100MB
export const TIP_MAX_TITLE_LENGTH = 120;
export const TIP_MAX_CONTENT_LENGTH = 20000;

export function tipAttachmentKind(mime: string | null | undefined): TipAttachmentKind {
  const m = (mime ?? "").toLowerCase();
  if (m.startsWith("image/")) return "image";
  if (m.startsWith("video/")) return "video";
  return "other";
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
