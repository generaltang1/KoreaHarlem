import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { getCurrentUser, isCurrentUserAdmin } from "@/lib/auth/session";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  if (!(await isCurrentUserAdmin())) {
    return NextResponse.json({ message: "권한이 없습니다." }, { status: 403 });
  }
  const admin = createServiceClient();
  if (!admin) {
    return NextResponse.json({ message: "SERVICE_ROLE_KEY 필요" }, { status: 503 });
  }

  const { id } = await context.params;
  const current = await getCurrentUser();
  if (current?.id === id) {
    return NextResponse.json({ message: "본인 계정은 이 API로 변경할 수 없습니다." }, { status: 400 });
  }

  const body = (await request.json()) as {
    role?: "user" | "admin";
    is_blocked?: boolean;
    blocked_reason?: string;
  };

  const patch: Record<string, unknown> = {};
  if (body.role === "user" || body.role === "admin") {
    patch.role = body.role;
  }
  if (typeof body.is_blocked === "boolean") {
    patch.is_blocked = body.is_blocked;
    patch.blocked_at = body.is_blocked ? new Date().toISOString() : null;
    patch.blocked_reason = body.is_blocked ? (body.blocked_reason ?? "").trim() || null : null;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ message: "변경할 항목이 없습니다." }, { status: 400 });
  }

  const { data, error } = await admin
    .from("profiles")
    .update(patch)
    .eq("id", id)
    .select("id, role, is_blocked, blocked_at, blocked_reason")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ message: "회원을 찾을 수 없습니다." }, { status: 404 });
  }

  return NextResponse.json({ profile: data });
}
