import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { sanitizeTipHtml, tipAttachmentKind } from "@/lib/tips";

type RouteContext = { params: Promise<{ id: string }> };

type CompletedUpload = {
  path: string;
  fileName: string;
  mimeType: string;
  kind: "image" | "video";
  pasteId?: string;
};

/** 클라이언트 Storage 업로드 완료 후 첨부 메타 저장 */
export async function POST(request: Request, context: RouteContext) {
  const admin = createServiceClient();
  if (!admin) {
    return NextResponse.json(
      { message: "SUPABASE_SERVICE_ROLE_KEY가 필요합니다." },
      { status: 503 },
    );
  }

  const { id: tipId } = await context.params;

  let body: { uploads?: CompletedUpload[] };
  try {
    body = (await request.json()) as { uploads?: CompletedUpload[] };
  } catch {
    return NextResponse.json({ message: "잘못된 요청입니다." }, { status: 400 });
  }

  const uploads = Array.isArray(body.uploads) ? body.uploads : [];
  for (const u of uploads) {
    if (!u.path.startsWith(`${tipId}/`)) {
      return NextResponse.json({ message: "잘못된 업로드 경로입니다." }, { status: 400 });
    }
  }

  const { data: tip, error: tipError } = await admin
    .from("tip_reports")
    .select("id, content_html")
    .eq("id", tipId)
    .maybeSingle();

  if (tipError || !tip) {
    return NextResponse.json({ message: "제보를 찾을 수 없습니다." }, { status: 404 });
  }

  let html = tip.content_html as string;
  const attachmentRows: {
    tip_id: string;
    file_url: string;
    file_name: string | null;
    mime_type: string | null;
    kind: string;
    sort_order: number;
  }[] = [];
  let sort = 0;

  for (const u of uploads) {
    const { data: urlData } = admin.storage.from("tips").getPublicUrl(u.path);
    const publicUrl = urlData.publicUrl;

    if (u.pasteId) {
      html = html.replace(
        new RegExp(`<img([^>]*?)data-paste-id=["']${u.pasteId}["']([^>]*?)>`, "gi"),
        `<img src="${publicUrl}" alt="" />`,
      );
      html = html.replace(
        new RegExp(`data-paste-id=["']${u.pasteId}["']`, "gi"),
        `src="${publicUrl}"`,
      );
    }

    attachmentRows.push({
      tip_id: tipId,
      file_url: publicUrl,
      file_name: u.fileName,
      mime_type: u.mimeType,
      kind: u.kind || tipAttachmentKind(u.mimeType),
      sort_order: sort++,
    });
  }

  const sanitized = sanitizeTipHtml(html);
  if (sanitized !== tip.content_html) {
    await admin.from("tip_reports").update({ content_html: sanitized }).eq("id", tipId);
  }

  if (attachmentRows.length > 0) {
    const { error: attErr } = await admin.from("tip_report_attachments").insert(attachmentRows);
    if (attErr) {
      console.error("[tips] attachments:", attErr.message);
      return NextResponse.json({ message: "첨부 정보 저장에 실패했습니다." }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true, id: tipId });
}
