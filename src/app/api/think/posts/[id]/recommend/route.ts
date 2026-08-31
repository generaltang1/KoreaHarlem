import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth/session";
import { getClientIp } from "@/lib/requestIp";
import { THINK_CONCEPT_THRESHOLD } from "@/lib/think";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const admin = createServiceClient();
  if (!admin) {
    return NextResponse.json({ message: "SUPABASE_SERVICE_ROLE_KEY가 필요합니다." }, { status: 503 });
  }

  const { id: postId } = await context.params;
  const voterIp = getClientIp(request);
  const user = await getCurrentUser();

  const { data: post } = await admin
    .from("think_posts")
    .select("id, recommend_count, is_notice")
    .eq("id", postId)
    .maybeSingle();

  if (!post) {
    return NextResponse.json({ message: "게시글을 찾을 수 없습니다." }, { status: 404 });
  }

  const { error: voteErr } = await admin.from("think_post_recommends").insert({
    post_id: postId,
    user_id: user?.id ?? null,
    voter_ip: voterIp,
  });

  if (voteErr) {
    if (voteErr.code === "23505") {
      return NextResponse.json({ message: "이미 추천하셨습니다." }, { status: 409 });
    }
    console.error("[think recommend]", voteErr.message);
    return NextResponse.json({ message: "추천에 실패했습니다." }, { status: 500 });
  }

  const newCount = (post.recommend_count ?? 0) + 1;
  await admin.from("think_posts").update({ recommend_count: newCount }).eq("id", postId);

  return NextResponse.json({
    ok: true,
    recommend_count: newCount,
    is_concept: !post.is_notice && newCount >= THINK_CONCEPT_THRESHOLD,
  });
}
