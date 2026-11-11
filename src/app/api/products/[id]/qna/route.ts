import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { getCurrentUser, isCurrentUserBlocked } from "@/lib/auth/session";
import { getMemberNickname } from "@/lib/think";

type RouteContext = { params: Promise<{ id: string }> };

const MAX_QUESTION = 1000;

export async function GET(_request: Request, context: RouteContext) {
  const admin = createServiceClient();
  if (!admin) {
    return NextResponse.json({ message: "SUPABASE_SERVICE_ROLE_KEY가 필요합니다." }, { status: 503 });
  }

  const { id } = await context.params;
  const { data, error } = await admin
    .from("product_qna")
    .select(
      "id, product_id, user_id, author_nickname, question, answer, answered_at, created_at",
    )
    .eq("product_id", id)
    .eq("is_hidden", false)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      {
        message: error.message.includes("product_qna")
          ? "product_qna 테이블이 없습니다. supabase/add_admin_dashboard_phase2.sql을 실행하세요."
          : "Q&A를 불러오지 못했습니다.",
        items: [],
      },
      { status: error.message.includes("product_qna") ? 503 : 500 },
    );
  }

  return NextResponse.json({ items: data ?? [] });
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
  const body = (await request.json()) as { question?: string };
  const question = (body.question ?? "").trim();

  if (!question) {
    return NextResponse.json({ message: "질문을 입력해주세요." }, { status: 400 });
  }
  if (question.length > MAX_QUESTION) {
    return NextResponse.json(
      { message: `질문은 ${MAX_QUESTION}자 이하여야 합니다.` },
      { status: 400 },
    );
  }

  const { data: product } = await admin.from("products").select("id").eq("id", id).maybeSingle();
  if (!product) {
    return NextResponse.json({ message: "상품을 찾을 수 없습니다." }, { status: 404 });
  }

  const { data: item, error } = await admin
    .from("product_qna")
    .insert({
      product_id: id,
      user_id: user.id,
      author_nickname: getMemberNickname(user),
      question: question.slice(0, MAX_QUESTION),
    })
    .select(
      "id, product_id, user_id, author_nickname, question, answer, answered_at, created_at",
    )
    .single();

  if (error || !item) {
    return NextResponse.json(
      {
        message: error?.message?.includes("product_qna")
          ? "product_qna 테이블이 없습니다. supabase/add_admin_dashboard_phase2.sql을 실행하세요."
          : error?.message || "질문 등록 실패",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({ item });
}
