import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { isCurrentUserAdmin } from "@/lib/auth/session";
import type { MagazineCategory, MagazineStatus } from "@/lib/magazine";
import { writeAdminAudit } from "@/lib/adminAudit";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  if (!(await isCurrentUserAdmin())) {
    return NextResponse.json({ message: "권한이 없습니다." }, { status: 403 });
  }
  const admin = createServiceClient();
  if (!admin) return NextResponse.json({ message: "SERVICE_ROLE_KEY 필요" }, { status: 503 });

  const { id } = await context.params;
  const body = (await request.json()) as Partial<{
    title: string;
    excerpt: string;
    content_html: string;
    cover_url: string | null;
    category: MagazineCategory;
    status: MagazineStatus;
    show_on_music: boolean;
    published_at: string | null;
    scheduled_at: string | null;
  }>;

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (typeof body.title === "string") patch.title = body.title.trim();
  if (typeof body.excerpt === "string") patch.excerpt = body.excerpt.trim();
  if (typeof body.content_html === "string") patch.content_html = body.content_html;
  if ("cover_url" in body) patch.cover_url = body.cover_url ?? null;
  if (body.category === "culture" || body.category === "news") patch.category = body.category;
  if (body.status) {
    patch.status = body.status;
    if (body.status === "published" && !body.published_at) {
      patch.published_at = new Date().toISOString();
    }
    if (body.status === "scheduled" && !("scheduled_at" in body)) {
      /* keep existing scheduled_at unless provided */
    }
    if (body.status !== "scheduled" && !("scheduled_at" in body)) {
      patch.scheduled_at = null;
    }
  }
  if (typeof body.show_on_music === "boolean") patch.show_on_music = body.show_on_music;
  if ("published_at" in body) patch.published_at = body.published_at;
  if ("scheduled_at" in body) patch.scheduled_at = body.scheduled_at;

  const { data, error } = await admin
    .from("magazine_posts")
    .update(patch)
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ message: "글을 찾을 수 없습니다." }, { status: 404 });

  await writeAdminAudit({
    module: "magazine",
    action: "update",
    targetType: "magazine_post",
    targetId: id,
    summary: `매거진 수정 · ${data.title} (${data.status})`,
    meta: { status: data.status, scheduled_at: data.scheduled_at },
  });

  return NextResponse.json({ post: data });
}

export async function DELETE(_request: Request, context: RouteContext) {
  if (!(await isCurrentUserAdmin())) {
    return NextResponse.json({ message: "권한이 없습니다." }, { status: 403 });
  }
  const admin = createServiceClient();
  if (!admin) return NextResponse.json({ message: "SERVICE_ROLE_KEY 필요" }, { status: 503 });

  const { id } = await context.params;
  const { error } = await admin.from("magazine_posts").delete().eq("id", id);
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
