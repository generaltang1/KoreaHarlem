import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import {
  TIP_MAX_ATTACHMENTS,
  TIP_MAX_CONTENT_LENGTH,
  TIP_MAX_TITLE_LENGTH,
  TipFileMeta,
  TipPasteMeta,
  extFromTipFileName,
  sanitizeTipHtml,
  validateTipFileMeta,
} from "@/lib/tips";

type TipCreateBody = {
  title?: string;
  contentHtml?: string;
  attachments?: TipFileMeta[];
  pasteImages?: TipPasteMeta[];
};

/** 공개 제보 등록 — 메타데이터만 받고 Signed Upload URL 발급 (대용량 파일은 클라이언트→Storage 직접 업로드) */
export async function POST(request: Request) {
  const admin = createServiceClient();
  if (!admin) {
    return NextResponse.json(
      { message: "SUPABASE_SERVICE_ROLE_KEY가 필요합니다." },
      { status: 503 },
    );
  }

  let body: TipCreateBody;
  try {
    body = (await request.json()) as TipCreateBody;
  } catch {
    return NextResponse.json({ message: "잘못된 요청입니다." }, { status: 400 });
  }

  const title = String(body.title ?? "").trim();
  const rawHtml = String(body.contentHtml ?? "");
  const contentHtml = sanitizeTipHtml(rawHtml);
  const attachmentMetas = Array.isArray(body.attachments) ? body.attachments : [];
  const pasteMetas = Array.isArray(body.pasteImages) ? body.pasteImages : [];

  if (!title) {
    return NextResponse.json({ message: "제목을 입력해주세요." }, { status: 400 });
  }
  if (title.length > TIP_MAX_TITLE_LENGTH) {
    return NextResponse.json({ message: "제목이 너무 깁니다." }, { status: 400 });
  }
  if (contentHtml.length > TIP_MAX_CONTENT_LENGTH) {
    return NextResponse.json({ message: "내용이 너무 깁니다." }, { status: 400 });
  }
  if (attachmentMetas.length + pasteMetas.length > TIP_MAX_ATTACHMENTS) {
    return NextResponse.json(
      { message: `첨부·붙여넣기 파일은 최대 ${TIP_MAX_ATTACHMENTS}개까지입니다.` },
      { status: 400 },
    );
  }

  for (const file of [...attachmentMetas, ...pasteMetas]) {
    const err = validateTipFileMeta(file);
    if (err) return NextResponse.json({ message: err }, { status: 400 });
  }

  const textOnly = contentHtml.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").trim();
  if (!textOnly && attachmentMetas.length === 0 && pasteMetas.length === 0) {
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
  const uploads: {
    path: string;
    token: string;
    signedUrl: string;
    fileName: string;
    mimeType: string;
    kind: "image" | "video";
    pasteId?: string;
  }[] = [];

  for (let i = 0; i < pasteMetas.length; i++) {
    const meta = pasteMetas[i];
    const ext = extFromTipFileName(meta.name || "paste.png", meta.mimeType);
    const path = `${tipId}/paste/${crypto.randomUUID()}.${ext}`;
    const { data, error } = await admin.storage.from("tips").createSignedUploadUrl(path);
    if (error || !data) {
      await admin.from("tip_reports").delete().eq("id", tipId);
      return NextResponse.json(
        {
          message: error?.message.includes("Bucket")
            ? "add_tip_reports.sql을 실행해주세요. (tips 버킷)"
            : `업로드 URL 생성 실패: ${error?.message ?? "unknown"}`,
        },
        { status: 500 },
      );
    }
    uploads.push({
      path: data.path,
      token: data.token,
      signedUrl: data.signedUrl,
      fileName: meta.name || `paste-${i}.${ext}`,
      mimeType: meta.mimeType || "image/png",
      kind: "image",
      pasteId: meta.pasteId,
    });
  }

  for (const meta of attachmentMetas) {
    const ext = extFromTipFileName(meta.name, meta.mimeType);
    const path = `${tipId}/files/${crypto.randomUUID()}.${ext}`;
    const { data, error } = await admin.storage.from("tips").createSignedUploadUrl(path);
    if (error || !data) {
      await admin.from("tip_reports").delete().eq("id", tipId);
      return NextResponse.json(
        {
          message: error?.message.includes("Bucket")
            ? "add_tip_reports.sql을 실행해주세요. (tips 버킷)"
            : `업로드 URL 생성 실패: ${error?.message ?? "unknown"}`,
        },
        { status: 500 },
      );
    }
    const kind = meta.mimeType.startsWith("video/") ? "video" : "image";
    uploads.push({
      path: data.path,
      token: data.token,
      signedUrl: data.signedUrl,
      fileName: meta.name,
      mimeType: meta.mimeType,
      kind,
    });
  }

  return NextResponse.json({ ok: true, id: tipId, uploads });
}
