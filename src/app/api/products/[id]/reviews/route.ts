import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";
import {
  getCurrentUser,
  isCurrentUserAdmin,
  isCurrentUserBlocked,
} from "@/lib/auth/session";
import { getMemberNickname } from "@/lib/think";
import { writeAdminAudit } from "@/lib/adminAudit";

type RouteContext = { params: Promise<{ id: string }> };

const MAX_REVIEW_BODY = 2000;

export async function GET(_request: Request, context: RouteContext) {
  const admin = createServiceClient();
  if (!admin) {
    return NextResponse.json({ message: "SUPABASE_SERVICE_ROLE_KEY가 필요합니다." }, { status: 503 });
  }

  const { id } = await context.params;
  const { data, error } = await admin
    .from("product_reviews")
    .select("id, product_id, user_id, author_nickname, rating, body, created_at")
    .eq("product_id", id)
    .eq("is_hidden", false)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      {
        message: error.message.includes("product_reviews")
          ? "product_reviews 테이블이 없습니다. supabase/add_admin_dashboard_phase2.sql을 실행하세요."
          : "후기를 불러오지 못했습니다.",
        reviews: [],
      },
      { status: error.message.includes("product_reviews") ? 503 : 500 },
    );
  }

  return NextResponse.json({ reviews: data ?? [] });
}

export async function POST(request: Request, context: RouteContext) {
  const admin = createServiceClient();
  if (!admin) {
    return NextResponse.json({ message: "SUPABASE_SERVICE_ROLE_KEY가 필요합니다." }, { status: 503 });
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
  }
  if (await isCurrentUserBlocked()) {
    return NextResponse.json({ message: "이용이 제한된 계정입니다." }, { status: 403 });
  }

  const { id } = await context.params;
  const body = (await request.json()) as { rating?: number; body?: string };
  const text = (body.body ?? "").trim();
  const rating = Number(body.rating);

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ message: "별점은 1~5 사이여야 합니다." }, { status: 400 });
  }
  if (!text) {
    return NextResponse.json({ message: "후기 내용을 입력해주세요." }, { status: 400 });
  }
  if (text.length > MAX_REVIEW_BODY) {
    return NextResponse.json(
      { message: `후기는 ${MAX_REVIEW_BODY}자 이하여야 합니다.` },
      { status: 400 },
    );
  }

  const { data: product } = await admin.from("products").select("id").eq("id", id).maybeSingle();
  if (!product) {
    return NextResponse.json({ message: "상품을 찾을 수 없습니다." }, { status: 404 });
  }

  const { data: review, error } = await admin
    .from("product_reviews")
    .insert({
      product_id: id,
      user_id: user.id,
      author_nickname: getMemberNickname(user),
      rating,
      body: text.slice(0, MAX_REVIEW_BODY),
    })
    .select("id, product_id, user_id, author_nickname, rating, body, created_at")
    .single();

  if (error || !review) {
    return NextResponse.json(
      {
        message: error?.message?.includes("product_reviews")
          ? "product_reviews 테이블이 없습니다. supabase/add_admin_dashboard_phase2.sql을 실행하세요."
          : error?.message || "후기 등록 실패",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({ review });
}

export async function DELETE(request: Request, context: RouteContext) {
  if (!(await isCurrentUserAdmin())) {
    return NextResponse.json({ message: "권한이 없습니다." }, { status: 403 });
  }

  const admin = createServiceClient();
  if (!admin) {
    return NextResponse.json({ message: "SUPABASE_SERVICE_ROLE_KEY가 필요합니다." }, { status: 503 });
  }

  const { id } = await context.params;
  const body = (await request.json()) as { reviewId?: string };
  const reviewId = (body.reviewId ?? "").trim();
  if (!reviewId) {
    return NextResponse.json({ message: "reviewId가 필요합니다." }, { status: 400 });
  }

  const { data: existing } = await admin
    .from("product_reviews")
    .select("id, body, author_nickname")
    .eq("id", reviewId)
    .eq("product_id", id)
    .maybeSingle();

  if (!existing) {
    return NextResponse.json({ message: "후기를 찾을 수 없습니다." }, { status: 404 });
  }

  const { error } = await admin.from("product_reviews").delete().eq("id", reviewId);
  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  await writeAdminAudit({
    module: "products",
    action: "delete_review",
    targetType: "product_review",
    targetId: reviewId,
    summary: `상품 후기 삭제 (${existing.author_nickname || "익명"})`,
    meta: { productId: id, bodyPreview: String(existing.body ?? "").slice(0, 120) },
  });

  return NextResponse.json({ ok: true });
}
