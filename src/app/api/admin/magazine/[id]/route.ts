import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { isCurrentUserAdmin } from "@/lib/auth/session";
import type { MagazineCategory, MagazineStatus } from "@/lib/magazine";
import {
  blocksToHtml,
  normalizeHashtags,
  parseBlocks,
  parseRelatedLinks,
  slugifyTitle,
} from "@/lib/magazineBlocks";
import { writeAdminAudit } from "@/lib/adminAudit";

type RouteContext = { params: Promise<{ id: string }> };

async function uniqueSlug(
  admin: NonNullable<ReturnType<typeof createServiceClient>>,
  desired: string,
  excludeId: string,
): Promise<string> {
  const base = slugifyTitle(desired);
  let candidate = base;
  for (let i = 0; i < 20; i++) {
    const { data } = await admin
      .from("magazine_posts")
      .select("id")
      .eq("slug", candidate)
      .neq("id", excludeId)
      .limit(1)
      .maybeSingle();
    if (!data) return candidate;
    candidate = `${base}-${i + 2}`;
  }
  return `${base}-${Date.now().toString(36)}`;
}

export async function GET(_request: Request, context: RouteContext) {
  if (!(await isCurrentUserAdmin())) {
    return NextResponse.json({ message: "권한이 없습니다." }, { status: 403 });
  }
  const admin = createServiceClient();
  if (!admin) return NextResponse.json({ message: "SERVICE_ROLE_KEY 필요" }, { status: 503 });
  const { id } = await context.params;
  const { data, error } = await admin.from("magazine_posts").select("*").eq("id", id).maybeSingle();
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ message: "글을 찾을 수 없습니다." }, { status: 404 });
  return NextResponse.json({ post: data });
}

export async function PATCH(request: Request, context: RouteContext) {
  if (!(await isCurrentUserAdmin())) {
    return NextResponse.json({ message: "권한이 없습니다." }, { status: 403 });
  }
  const admin = createServiceClient();
  if (!admin) return NextResponse.json({ message: "SERVICE_ROLE_KEY 필요" }, { status: 503 });

  const { id } = await context.params;
  const body = (await request.json()) as Record<string, unknown>;
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (typeof body.title === "string") patch.title = body.title.trim();
  if (typeof body.excerpt === "string") patch.excerpt = body.excerpt.trim();
  if ("content_blocks" in body) {
    const blocks = parseBlocks(body.content_blocks, String(body.content_html ?? ""));
    patch.content_blocks = blocks;
    patch.content_html =
      typeof body.content_html === "string" && body.content_html
        ? body.content_html
        : blocksToHtml(blocks);
  } else if (typeof body.content_html === "string") {
    patch.content_html = body.content_html;
  }
  if ("cover_url" in body) patch.cover_url = body.cover_url ?? null;
  if (typeof body.cover_credit === "string") patch.cover_credit = body.cover_credit.trim();
  if (body.category === "culture" || body.category === "news") {
    patch.category = body.category as MagazineCategory;
  }
  if (typeof body.show_on_music === "boolean") patch.show_on_music = body.show_on_music;
  if (typeof body.is_cover_story === "boolean") patch.is_cover_story = body.is_cover_story;
  if (Array.isArray(body.hashtags)) {
    patch.hashtags = normalizeHashtags(body.hashtags.map(String));
  }
  if (typeof body.credit_text === "string") patch.credit_text = body.credit_text.trim();
  if (typeof body.credit_photo === "string") patch.credit_photo = body.credit_photo.trim();
  if (typeof body.credit_edit === "string") patch.credit_edit = body.credit_edit.trim();
  if ("related_links" in body) patch.related_links = parseRelatedLinks(body.related_links);

  if (typeof body.slug === "string" && body.slug.trim()) {
    patch.slug = await uniqueSlug(admin, body.slug.trim(), id);
  } else if (typeof body.title === "string" && body.title.trim() && !("slug" in body)) {
    /* keep existing slug */
  }

  if (body.status) {
    const status = body.status as MagazineStatus;
    patch.status = status;
    if (status === "published" && !body.published_at) {
      patch.published_at = new Date().toISOString();
    }
    if ("published_at" in body) patch.published_at = body.published_at;
    if (status === "scheduled") {
      if ("scheduled_at" in body) patch.scheduled_at = body.scheduled_at;
    } else if (!("scheduled_at" in body)) {
      patch.scheduled_at = null;
    }
  }
  if ("scheduled_at" in body && body.status === "scheduled") {
    patch.scheduled_at = body.scheduled_at;
  }

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
    meta: { status: data.status, slug: data.slug },
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
