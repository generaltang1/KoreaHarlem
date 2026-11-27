import { NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/adminApi";
import { createServiceClient } from "@/lib/supabase/admin";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const auth = await assertAdminApi();
  if (auth.error) return auth.error;

  const admin = createServiceClient();
  if (!admin) {
    return NextResponse.json({ message: "서비스 키가 필요합니다." }, { status: 503 });
  }

  const { id } = await context.params;
  const { data, error } = await admin
    .from("album_supporters")
    .select("id, display_name, comment, is_public, sort_order, created_at, user_id")
    .eq("album_id", id)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      {
        message: error.message.includes("album_supporters")
          ? "supabase/add_music_e_deep.sql 을 실행해 주세요."
          : error.message,
        supporters: [],
      },
      { status: 500 },
    );
  }

  return NextResponse.json({ supporters: data ?? [] });
}

export async function POST(request: Request, context: RouteContext) {
  const auth = await assertAdminApi();
  if (auth.error) return auth.error;

  const admin = createServiceClient();
  if (!admin) {
    return NextResponse.json({ message: "서비스 키가 필요합니다." }, { status: 503 });
  }

  const { id } = await context.params;
  const body = (await request.json()) as {
    displayName?: string;
    comment?: string;
    isPublic?: boolean;
  };
  const displayName = (body.displayName ?? "").trim();
  const comment = (body.comment ?? "").trim() || null;

  if (!displayName || displayName.length > 40) {
    return NextResponse.json({ message: "닉네임은 1~40자입니다." }, { status: 400 });
  }
  if (comment && comment.length > 200) {
    return NextResponse.json({ message: "코멘트는 200자 이하여야 합니다." }, { status: 400 });
  }

  const { data, error } = await admin
    .from("album_supporters")
    .insert({
      album_id: id,
      display_name: displayName,
      comment,
      is_public: body.isPublic !== false,
    })
    .select("id, display_name, comment, is_public, sort_order, created_at, user_id")
    .single();

  if (error || !data) {
    return NextResponse.json(
      {
        message: error?.message?.includes("album_supporters")
          ? "supabase/add_music_e_deep.sql 을 실행해 주세요."
          : error?.message || "등록 실패",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({ supporter: data });
}

export async function DELETE(request: Request, context: RouteContext) {
  const auth = await assertAdminApi();
  if (auth.error) return auth.error;

  const admin = createServiceClient();
  if (!admin) {
    return NextResponse.json({ message: "서비스 키가 필요합니다." }, { status: 503 });
  }

  const { id } = await context.params;
  const body = (await request.json()) as { supporterId?: string };
  if (!body.supporterId) {
    return NextResponse.json({ message: "supporterId가 필요합니다." }, { status: 400 });
  }

  const { error } = await admin
    .from("album_supporters")
    .delete()
    .eq("id", body.supporterId)
    .eq("album_id", id);

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
