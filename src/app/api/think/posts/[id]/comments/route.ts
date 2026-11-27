import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { getCurrentUser, isCurrentUserBlocked } from "@/lib/auth/session";
import { getClientIp } from "@/lib/requestIp";
import {
  THINK_MAX_GUEST_NICKNAME,
  formatThinkAuthorDisplay,
  getMemberNickname,
  normalizeGuestNickname,
} from "@/lib/think";

type RouteContext = { params: Promise<{ id: string }> };

const THINK_MAX_COMMENT_LENGTH = 2000;

function withDisplay<T extends {
  user_id: string | null;
  author_nickname: string;
  author_ip: string;
}>(c: T) {
  return {
    ...c,
    author_display: formatThinkAuthorDisplay({
      user_id: c.user_id,
      author_nickname: c.author_nickname,
      author_ip: c.author_ip,
    }),
  };
}

export async function GET(_request: Request, context: RouteContext) {
  const admin = createServiceClient();
  if (!admin) {
    return NextResponse.json({ message: "SUPABASE_SERVICE_ROLE_KEY가 필요합니다." }, { status: 503 });
  }

  const { id } = await context.params;
  const { data, error } = await admin
    .from("think_comments")
    .select("*")
    .eq("post_id", id)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json(
      {
        message: error.message.includes("think_comments")
          ? "think_comments 테이블이 없습니다. supabase/add_think_comments.sql을 실행하세요."
          : "댓글을 불러오지 못했습니다.",
        comments: [],
      },
      { status: error.message.includes("think_comments") ? 503 : 500 },
    );
  }

  return NextResponse.json({ comments: (data ?? []).map(withDisplay) });
}

export async function POST(request: Request, context: RouteContext) {
  const admin = createServiceClient();
  if (!admin) {
    return NextResponse.json({ message: "SUPABASE_SERVICE_ROLE_KEY가 필요합니다." }, { status: 503 });
  }

  const { id } = await context.params;
  const body = (await request.json()) as {
    body?: string;
    guestNickname?: string;
    parentId?: string | null;
  };
  const text = (body.body ?? "").trim();
  const parentId = body.parentId?.trim() || null;

  if (!text) {
    return NextResponse.json({ message: "댓글 내용을 입력해주세요." }, { status: 400 });
  }
  if (text.length > THINK_MAX_COMMENT_LENGTH) {
    return NextResponse.json(
      { message: `댓글은 ${THINK_MAX_COMMENT_LENGTH}자 이하여야 합니다.` },
      { status: 400 },
    );
  }

  const { data: post } = await admin
    .from("think_posts")
    .select("id, is_hidden")
    .eq("id", id)
    .maybeSingle();
  if (!post || post.is_hidden) {
    return NextResponse.json({ message: "게시글을 찾을 수 없습니다." }, { status: 404 });
  }

  if (parentId) {
    const { data: parent } = await admin
      .from("think_comments")
      .select("id, post_id, parent_id")
      .eq("id", parentId)
      .maybeSingle();
    if (!parent || parent.post_id !== id) {
      return NextResponse.json({ message: "답글 대상 댓글을 찾을 수 없습니다." }, { status: 400 });
    }
    // 1단계만 허용 (대댓글의 대댓글 금지)
    if (parent.parent_id) {
      return NextResponse.json(
        { message: "답글에는 다시 답글을 달 수 없습니다. 원댓글에 답글해 주세요." },
        { status: 400 },
      );
    }
  }

  if (await isCurrentUserBlocked()) {
    return NextResponse.json({ message: "이용이 제한된 계정입니다." }, { status: 403 });
  }

  const user = await getCurrentUser();
  const ip = getClientIp(request);
  const authorNickname = user
    ? getMemberNickname(user)
    : normalizeGuestNickname(body.guestNickname).slice(0, THINK_MAX_GUEST_NICKNAME);

  const { data: comment, error } = await admin
    .from("think_comments")
    .insert({
      post_id: id,
      user_id: user?.id ?? null,
      author_nickname: authorNickname,
      author_ip: ip,
      body: text,
      parent_id: parentId,
    })
    .select("*")
    .single();

  if (error || !comment) {
    return NextResponse.json(
      {
        message: error?.message?.includes("parent_id")
          ? "대댓글 컬럼이 없습니다. supabase/add_think_comment_replies.sql 을 실행해 주세요."
          : error?.message?.includes("think_comments")
            ? "think_comments 테이블이 없습니다. supabase/add_think_comments.sql을 실행하세요."
            : error?.message || "댓글 등록 실패",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({ comment: withDisplay(comment) });
}
