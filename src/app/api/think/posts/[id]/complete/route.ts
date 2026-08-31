import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { sanitizeThinkHtml, thinkAttachmentKind } from "@/lib/think";

type RouteContext = { params: Promise<{ id: string }> };

type CompletedUpload = {
  path: string;
  fileName: string;
  mimeType: string;
  kind: "image" | "video";
  pasteId?: string;
};

export async function POST(request: Request, context: RouteContext) {
  const admin = createServiceClient();
  if (!admin) {
    return NextResponse.json({ message: "SUPABASE_SERVICE_ROLE_KEY가 필요합니다." }, { status: 503 });
  }

  const { id: postId } = await context.params;

  let body: { uploads?: CompletedUpload[] };
  try {
    body = (await request.json()) as { uploads?: CompletedUpload[] };
  } catch {
    return NextResponse.json({ message: "잘못된 요청입니다." }, { status: 400 });
  }

  const uploads = Array.isArray(body.uploads) ? body.uploads : [];
  for (const u of uploads) {
    if (!u.path.startsWith(`posts/${postId}/`)) {
      return NextResponse.json({ message: "잘못된 업로드 경로입니다." }, { status: 400 });
    }
  }

  const { data: post, error: postError } = await admin
    .from("think_posts")
    .select("id, content_html")
    .eq("id", postId)
    .maybeSingle();

  if (postError || !post) {
    return NextResponse.json({ message: "게시글을 찾을 수 없습니다." }, { status: 404 });
  }

  let html = post.content_html as string;
  const attachmentRows: {
    post_id: string;
    file_url: string;
    file_name: string | null;
    mime_type: string | null;
    kind: string;
    sort_order: number;
  }[] = [];
  let sort = 0;

  for (const u of uploads) {
    const { data: urlData } = admin.storage.from("think").getPublicUrl(u.path);
    const publicUrl = urlData.publicUrl;

    if (u.pasteId) {
      html = html.replace(
        new RegExp(`<img([^>]*?)data-paste-id=["']${u.pasteId}["']([^>]*?)>`, "gi"),
        `<img src="${publicUrl}" alt="" style="max-width:100%;height:auto;display:block;margin:12px 0" />`,
      );
      continue;
    }

    attachmentRows.push({
      post_id: postId,
      file_url: publicUrl,
      file_name: u.fileName,
      mime_type: u.mimeType,
      kind: u.kind || thinkAttachmentKind(u.mimeType),
      sort_order: sort++,
    });
  }

  const sanitized = sanitizeThinkHtml(html);
  if (sanitized !== post.content_html) {
    await admin.from("think_posts").update({ content_html: sanitized }).eq("id", postId);
  }

  if (attachmentRows.length > 0) {
    const { error: attErr } = await admin.from("think_post_attachments").insert(attachmentRows);
    if (attErr) {
      console.error("[think] attachments:", attErr.message);
      return NextResponse.json({ message: "첨부 정보 저장에 실패했습니다." }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true, id: postId });
}
