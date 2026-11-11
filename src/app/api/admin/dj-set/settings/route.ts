import { NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/adminApi";
import { createServiceClient } from "@/lib/supabase/admin";
import { writeAdminAudit } from "@/lib/adminAudit";

export async function GET() {
  const auth = await assertAdminApi();
  if (auth.error) return auth.error;

  const admin = createServiceClient();
  if (!admin) {
    return NextResponse.json({ message: "SERVICE_ROLE_KEY가 필요합니다." }, { status: 503 });
  }

  const { data, error } = await admin
    .from("dj_set_settings")
    .select("id, live_platform, live_url, live_enabled, updated_at")
    .eq("id", 1)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      {
        message: error.message.includes("dj_set_settings")
          ? "dj_set_settings 테이블이 없습니다. supabase/add_admin_dashboard_phase2.sql을 실행하세요."
          : error.message,
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    settings: data ?? {
      id: 1,
      live_platform: "youtube",
      live_url: null,
      live_enabled: false,
      updated_at: null,
    },
  });
}

export async function PATCH(request: Request) {
  const auth = await assertAdminApi();
  if (auth.error) return auth.error;

  const admin = createServiceClient();
  if (!admin) {
    return NextResponse.json({ message: "SERVICE_ROLE_KEY가 필요합니다." }, { status: 503 });
  }

  const body = (await request.json()) as {
    live_url?: string | null;
    live_enabled?: boolean;
    live_platform?: string;
  };

  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
    updated_by: auth.user.id,
  };
  if ("live_url" in body) {
    const url = typeof body.live_url === "string" ? body.live_url.trim() : "";
    patch.live_url = url || null;
  }
  if (typeof body.live_enabled === "boolean") patch.live_enabled = body.live_enabled;
  if (typeof body.live_platform === "string" && body.live_platform.trim()) {
    patch.live_platform = body.live_platform.trim();
  }

  const { data: existing } = await admin
    .from("dj_set_settings")
    .select("id")
    .eq("id", 1)
    .maybeSingle();

  let data;
  let error;
  if (existing) {
    ({ data, error } = await admin
      .from("dj_set_settings")
      .update(patch)
      .eq("id", 1)
      .select("id, live_platform, live_url, live_enabled, updated_at")
      .single());
  } else {
    ({ data, error } = await admin
      .from("dj_set_settings")
      .insert({
        id: 1,
        live_platform: "youtube",
        live_enabled: false,
        ...patch,
      })
      .select("id, live_platform, live_url, live_enabled, updated_at")
      .single());
  }

  if (error) {
    return NextResponse.json(
      {
        message: error.message.includes("dj_set_settings")
          ? "dj_set_settings 테이블이 없습니다. supabase/add_admin_dashboard_phase2.sql을 실행하세요."
          : error.message,
      },
      { status: 500 },
    );
  }

  if (!data) {
    return NextResponse.json({ message: "설정을 저장하지 못했습니다." }, { status: 500 });
  }

  await writeAdminAudit({
    module: "dj-set",
    action: "update_live_settings",
    targetType: "dj_set_settings",
    targetId: "1",
    summary: `DJ SET 라이브 ${data.live_enabled ? "ON" : "OFF"}${data.live_url ? ` · ${data.live_url}` : ""}`,
    meta: {
      live_enabled: data.live_enabled,
      live_url: data.live_url,
    },
  });

  return NextResponse.json({ settings: data });
}
