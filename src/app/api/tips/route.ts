import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import {
  TIP_MAX_ATTACHMENTS,
  TIP_MAX_CONTENT_LENGTH,
  TIP_MAX_IMAGE_BYTES,
  TIP_MAX_TITLE_LENGTH,
  TIP_MAX_VIDEO_BYTES,
  sanitizeTipHtml,
  tipAttachmentKind,
} from "@/lib/tips";

function extFromName(name: string, mime: string): string {
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

function validateFile(file: File): string | null {
  const kind = tipAttachmentKind(file.type);
  if (kind === "other") {
    return `"${file.name}"은(는) 이미지 또는 동영상만 첨부할 수 있습니다.`;
  }
  if (kind === "image" && file.size > TIP_MAX_IMAGE_BYTES) {
    return `이미지 "${file.name}"은(는) 10MB 이하여야 합니다.`;
  }
  if (kind === "video" && file.size > TIP_MAX_VIDEO_BYTES) {
    return `동영상 "${file.name}"은(는) 100MB 이하여야 합니다.`;
  }
  return null;
}

/** 공개 제보 등록 (회원·비회원) */
export async function POST(request: Request) {
  const admin = createServiceClient();
  if (!admin) {
    return NextResponse.json(
      { message: "SUPABASE_SERVICE_ROLE_KEY가 필요합니다." },
      { status: 503 },
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ message: "잘못된 요청입니다." }, { status: 400 });
  }

  const title = String(form.get("title") ?? "").trim();
  const rawHtml = String(form.get("contentHtml") ?? "");
  const contentHtml = sanitizeTipHtml(rawHtml);

  if (!title) {
    return NextResponse.json({ message: "제목을 입력해주세요." }, { status: 400 });
  }
  if (title.length > TIP_MAX_TITLE_LENGTH) {
    return NextResponse.json({ message: "제목이 너무 깁니다." }, { status: 400 });
  }
  if (!contentHtml || contentHtml.replace(/<[^>]+>/g, "").trim().length === 0) {
    // 본문 텍스트가 없어도 첨부만으로 허용할지 — 본문 또는 첨부 중 하나 필요
  }
  if (contentHtml.length > TIP_MAX_CONTENT_LENGTH) {
    return NextResponse.json({ message: "내용이 너무 깁니다." }, { status: 400 });
  }

  const attachmentFiles = form.getAll("attachments").filter((v): v is File => v instanceof File && v.size > 0);
  const pasteFiles = form.getAll("pasteImages").filter((v): v is File => v instanceof File && v.size > 0);
  const pasteIds = form.getAll("pasteIds").map((v) => String(v));

  if (attachmentFiles.length + pasteFiles.length > TIP_MAX_ATTACHMENTS) {
    return NextResponse.json(
      { message: `첨부·붙여넣기 파일은 최대 ${TIP_MAX_ATTACHMENTS}개까지입니다.` },
      { status: 400 },
    );
  }

  for (const file of [...attachmentFiles, ...pasteFiles]) {
    const err = validateFile(file);
    if (err) return NextResponse.json({ message: err }, { status: 400 });
  }

  const textOnly = contentHtml.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").trim();
  if (!textOnly && attachmentFiles.length === 0 && pasteFiles.length === 0) {
    return NextResponse.json({ message: "내용 또는 첨부파일을 입력해주세요." }, { status: 400 });
  }

  let userId: string | null = null;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userId = user?.id ?? null;
  } catch {
    /* guest ok */
  }

  const { data: tip, error: tipError } = await admin
    .from("tip_reports")
    .insert({
      title,
      content_html: contentHtml || "<p></p>",
      user_id: userId,
    })
    .select("id")
    .single();

  if (tipError || !tip) {
    const msg = tipError?.message ?? "";
    return NextResponse.json(
      {
        message: msg.includes("tip_reports")
          ? "add_tip_reports.sql을 실행해주세요."
          : msg || "제보 저장에 실패했습니다.",
      },
      { status: 500 },
    );
  }

  const tipId = tip.id as string;
  let html = contentHtml;
  const attachmentRows: {
    tip_id: string;
    file_url: string;
    file_name: string | null;
    mime_type: string | null;
    kind: string;
    sort_order: number;
  }[] = [];
  let sort = 0;

  // 붙여넣기 이미지 업로드 → content_html 의 data-paste-id 치환
  for (let i = 0; i < pasteFiles.length; i++) {
    const file = pasteFiles[i];
    const pasteId = pasteIds[i] || `paste-${i}`;
    const ext = extFromName(file.name || "paste.png", file.type);
    const path = `${tipId}/paste/${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await admin.storage.from("tips").upload(path, file, {
      contentType: file.type || "image/png",
      upsert: false,
    });
    if (upErr) {
      await admin.from("tip_reports").delete().eq("id", tipId);
      return NextResponse.json(
        {
          message: upErr.message.includes("Bucket")
            ? "add_tip_reports.sql을 실행해주세요. (tips 버킷)"
            : `붙여넣기 이미지 업로드 실패: ${upErr.message}`,
        },
        { status: 500 },
      );
    }
    const { data: urlData } = admin.storage.from("tips").getPublicUrl(path);
    const publicUrl = urlData.publicUrl;
    html = html.replace(
      new RegExp(`<img([^>]*?)data-paste-id=["']${pasteId}["']([^>]*?)>`, "gi"),
      `<img src="${publicUrl}" alt="" />`,
    );
    // blob src 제거된 img도 치환
    html = html.replace(
      new RegExp(`data-paste-id=["']${pasteId}["']`, "gi"),
      `src="${publicUrl}"`,
    );
    attachmentRows.push({
      tip_id: tipId,
      file_url: publicUrl,
      file_name: file.name || `paste-${i}.${ext}`,
      mime_type: file.type || "image/png",
      kind: "image",
      sort_order: sort++,
    });
  }

  for (const file of attachmentFiles) {
    const ext = extFromName(file.name, file.type);
    const path = `${tipId}/files/${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await admin.storage.from("tips").upload(path, file, {
      contentType: file.type,
      upsert: false,
    });
    if (upErr) {
      await admin.from("tip_reports").delete().eq("id", tipId);
      return NextResponse.json(
        {
          message: upErr.message.includes("Bucket")
            ? "add_tip_reports.sql을 실행해주세요. (tips 버킷)"
            : `첨부 업로드 실패: ${upErr.message}`,
        },
        { status: 500 },
      );
    }
    const { data: urlData } = admin.storage.from("tips").getPublicUrl(path);
    attachmentRows.push({
      tip_id: tipId,
      file_url: urlData.publicUrl,
      file_name: file.name,
      mime_type: file.type,
      kind: tipAttachmentKind(file.type),
      sort_order: sort++,
    });
  }

  if (html !== contentHtml) {
    await admin.from("tip_reports").update({ content_html: sanitizeTipHtml(html) }).eq("id", tipId);
  }

  if (attachmentRows.length > 0) {
    const { error: attErr } = await admin.from("tip_report_attachments").insert(attachmentRows);
    if (attErr) {
      console.error("[tips] attachments:", attErr.message);
    }
  }

  return NextResponse.json({ ok: true, id: tipId });
}
