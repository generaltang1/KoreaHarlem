import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { isCurrentUserAdmin } from "@/lib/auth/session";

export async function GET(request: Request) {
  if (!(await isCurrentUserAdmin())) {
    return NextResponse.json({ message: "권한이 없습니다." }, { status: 403 });
  }
  const admin = createServiceClient();
  if (!admin) {
    return NextResponse.json({ message: "SERVICE_ROLE_KEY 필요" }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim().toLowerCase() ?? "";
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const perPage = Math.min(100, Math.max(10, Number(searchParams.get("perPage") || 50)));

  const { data: listData, error } = await admin.auth.admin.listUsers({
    page,
    perPage,
  });
  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  const users = listData.users;
  const ids = users.map((u) => u.id);
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, role, is_blocked, blocked_at, blocked_reason, marketing_consent, created_at")
    .in("id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  let members = users.map((u) => {
    const profile = profileMap.get(u.id);
    return {
      id: u.id,
      email: u.email ?? "",
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at,
      providers: u.app_metadata?.providers ?? [],
      role: (profile?.role as string) || "user",
      is_blocked: Boolean(profile?.is_blocked),
      blocked_at: profile?.blocked_at ?? null,
      blocked_reason: profile?.blocked_reason ?? null,
      marketing_consent: Boolean(profile?.marketing_consent),
      profile_created_at: profile?.created_at ?? null,
    };
  });

  if (q) {
    members = members.filter(
      (m) =>
        m.email.toLowerCase().includes(q) ||
        m.id.toLowerCase().includes(q) ||
        m.role.toLowerCase().includes(q),
    );
  }

  const { count: profileCount } = await admin
    .from("profiles")
    .select("id", { count: "exact", head: true });
  const { count: blockedCount } = await admin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("is_blocked", true);
  const { count: adminCount } = await admin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "admin");

  return NextResponse.json({
    members,
    total: profileCount ?? members.length,
    kpi: {
      total: profileCount ?? members.length,
      admins: adminCount ?? 0,
      blocked: blockedCount ?? 0,
      pageSize: members.length,
    },
  });
}
