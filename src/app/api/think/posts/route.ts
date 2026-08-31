import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { getCurrentUser, isCurrentUserAdmin } from "@/lib/auth/session";
import { getClientIp } from "@/lib/requestIp";
import {
  THINK_CONCEPT_THRESHOLD,
  THINK_MAX_CONTENT_LENGTH,
  THINK_MAX_INLINE_IMAGES,
  THINK_MAX_TITLE_LENGTH,
  THINK_MAX_VIDEO_ATTACHMENTS,
  THINK_PAGE_SIZE,
  ThinkFileMeta,
  ThinkPasteMeta,
  ThinkTab,
  ThinkYoutubeInput,
  extFromThinkFileName,
  formatThinkAuthorDisplay,
  getMemberNickname,
  normalizeGuestNickname,
  sanitizeThinkHtml,
  thinkAttachmentKind,
  validateThinkFileMeta,
} from "@/lib/think";

type ThinkCreateBody = {
  title?: string;
  contentHtml?: string;
  guestNickname?: string;
  isNotice?: boolean;
  attachments?: ThinkFileMeta[];
  pasteImages?: ThinkPasteMeta[];
  youtubeVideos?: ThinkYoutubeInput[];
};

function parseTab(value: string | null): ThinkTab {
  if (value === "concept" || value === "notice") return value;
  return "all";
}

export async function GET(request: Request) {
  const admin = createServiceClient();
  if (!admin) {
    return NextResponse.json({ message: "SUPABASE_SERVICE_ROLE_KEY가 필요합니다." }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const tab = parseTab(searchParams.get("tab"));
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
  const perPage = Math.min(50, Math.max(10, Number(searchParams.get("perPage") ?? THINK_PAGE_SIZE) || THINK_PAGE_SIZE));
  const q = (searchParams.get("q") ?? "").trim();
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  let query = admin.from("think_posts").select("*", { count: "exact" });

  if (tab === "notice") {
    query = query.eq("is_notice", true);
  } else if (tab === "concept") {
    query = query.eq("is_notice", false).gte("recommend_count", THINK_CONCEPT_THRESHOLD);
  } else {
    query = query.order("is_notice", { ascending: false });
  }

  if (q) {
    query = query.or(`title.ilike.%${q}%,content_html.ilike.%${q}%`);
  }

  if (tab === "notice") {
    query = query.order("created_at", { ascending: false });
  } else if (tab === "concept") {
    query = query.order("recommend_count", { ascending: false }).order("created_at", { ascending: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const { data, error, count } = await query.range(from, to);
  if (error) {
    console.error("[think posts list]", error.message);
    return NextResponse.json({ message: "게시글 목록을 불러오지 못했습니다." }, { status: 500 });
  }

  const posts = (data ?? []).map((post) => ({
    ...post,
    author_display: formatThinkAuthorDisplay(post),
  }));

  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  return NextResponse.json({
    posts,
    pagination: { page, perPage, total, totalPages },
    tab,
  });
}

export async function POST(request: Request) {
  const admin = createServiceClient();
  if (!admin) {
    return NextResponse.json({ message: "SUPABASE_SERVICE_ROLE_KEY가 필요합니다." }, { status: 503 });
  }

  let body: ThinkCreateBody;
  try {
    body = (await request.json()) as ThinkCreateBody;
  } catch {
    return NextResponse.json({ message: "잘못된 요청입니다." }, { status: 400 });
  }

  const title = String(body.title ?? "").trim();
  const rawHtml = String(body.contentHtml ?? "");
  const contentHtml = sanitizeThinkHtml(rawHtml);
  const attachmentMetas = Array.isArray(body.attachments) ? body.attachments : [];
  const pasteMetas = Array.isArray(body.pasteImages) ? body.pasteImages : [];
  const youtubeVideos = Array.isArray(body.youtubeVideos) ? body.youtubeVideos : [];
  const wantsNotice = Boolean(body.isNotice);

  if (!title) return NextResponse.json({ message: "제목을 입력해주세요." }, { status: 400 });
  if (title.length > THINK_MAX_TITLE_LENGTH) {
    return NextResponse.json({ message: "제목이 너무 깁니다." }, { status: 400 });
  }
  if (contentHtml.length > THINK_MAX_CONTENT_LENGTH) {
    return NextResponse.json({ message: "내용이 너무 깁니다." }, { status: 400 });
  }
  if (pasteMetas.length > THINK_MAX_INLINE_IMAGES) {
    return NextResponse.json(
      { message: `본문 이미지는 최대 ${THINK_MAX_INLINE_IMAGES}개까지입니다.` },
      { status: 400 },
    );
  }
  if (attachmentMetas.length > THINK_MAX_VIDEO_ATTACHMENTS) {
    return NextResponse.json(
      { message: `동영상 첨부는 최대 ${THINK_MAX_VIDEO_ATTACHMENTS}개까지입니다.` },
      { status: 400 },
    );
  }

  for (const file of [...attachmentMetas, ...pasteMetas]) {
    const err = validateThinkFileMeta(file);
    if (err) return NextResponse.json({ message: err }, { status: 400 });
  }

  const textOnly = contentHtml.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").trim();
  const hasInlineImages = /<img[\s>]/i.test(contentHtml);
  if (
    !textOnly &&
    !hasInlineImages &&
    attachmentMetas.length === 0 &&
    pasteMetas.length === 0 &&
    youtubeVideos.length === 0
  ) {
    return NextResponse.json({ message: "내용 또는 첨부를 입력해주세요." }, { status: 400 });
  }

  if (wantsNotice && !(await isCurrentUserAdmin())) {
    return NextResponse.json({ message: "공지는 관리자만 등록할 수 있습니다." }, { status: 403 });
  }

  const user = await getCurrentUser();
  const clientIp = getClientIp(request);
  const authorNickname = user ? getMemberNickname(user) : normalizeGuestNickname(body.guestNickname);

  const { data: post, error: insertErr } = await admin
    .from("think_posts")
    .insert({
      title,
      content_html: contentHtml,
      user_id: user?.id ?? null,
      author_nickname: authorNickname,
      author_ip: clientIp,
      is_notice: wantsNotice,
    })
    .select("id")
    .single();

  if (insertErr || !post) {
    console.error("[think create]", insertErr?.message);
    return NextResponse.json({ message: "게시글 등록에 실패했습니다." }, { status: 500 });
  }

  const postId = post.id as string;

  if (youtubeVideos.length > 0) {
    const rows = youtubeVideos.map((v, i) => ({
      post_id: postId,
      video_id: v.videoId,
      title: v.title ?? null,
      channel_title: v.channelTitle ?? null,
      thumbnail_url: v.thumbnailUrl ?? null,
      sort_order: i,
    }));
    const { error: ytErr } = await admin.from("think_post_youtube").insert(rows);
    if (ytErr) {
      await admin.from("think_posts").delete().eq("id", postId);
      return NextResponse.json({ message: "유튜브 정보 저장에 실패했습니다." }, { status: 500 });
    }
  }

  const uploads: {
    path: string;
    token: string;
    signedUrl: string;
    fileName: string;
    mimeType: string;
    kind: "image" | "video";
    pasteId?: string;
  }[] = [];

  let fileIndex = 0;
  for (const file of attachmentMetas) {
    const kind = thinkAttachmentKind(file.mimeType);
    if (kind !== "image" && kind !== "video") continue;
    const ext = extFromThinkFileName(file.name, file.mimeType);
    const path = `posts/${postId}/${Date.now()}-${fileIndex++}.${ext}`;
    const { data, error } = await admin.storage.from("think").createSignedUploadUrl(path);
    if (error || !data) {
      await admin.from("think_posts").delete().eq("id", postId);
      return NextResponse.json({ message: "업로드 URL 발급에 실패했습니다." }, { status: 500 });
    }
    uploads.push({
      path,
      token: data.token,
      signedUrl: data.signedUrl,
      fileName: file.name,
      mimeType: file.mimeType,
      kind,
    });
  }

  for (const paste of pasteMetas) {
    const ext = extFromThinkFileName(paste.name, paste.mimeType);
    const path = `posts/${postId}/paste-${paste.pasteId}.${ext}`;
    const { data, error } = await admin.storage.from("think").createSignedUploadUrl(path);
    if (error || !data) {
      await admin.from("think_posts").delete().eq("id", postId);
      return NextResponse.json({ message: "업로드 URL 발급에 실패했습니다." }, { status: 500 });
    }
    uploads.push({
      path,
      token: data.token,
      signedUrl: data.signedUrl,
      fileName: paste.name,
      mimeType: paste.mimeType,
      kind: "image",
      pasteId: paste.pasteId,
    });
  }

  return NextResponse.json({ id: postId, uploads });
}
