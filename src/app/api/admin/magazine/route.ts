import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { getCurrentUser, isCurrentUserAdmin } from "@/lib/auth/session";
import type { MagazineCategory, MagazineStatus } from "@/lib/magazine";
import {
  blocksToHtml,
  normalizeHashtags,
  parseBlocks,
  parseRelatedLinks,
  slugifyTitle,
} from "@/lib/magazineBlocks";
import { publishDueScheduledMagazine } from "@/lib/magazinePublish";
import { writeAdminAudit } from "@/lib/adminAudit";

async function uniqueSlug(
  admin: NonNullable<ReturnType<typeof createServiceClient>>,
  desired: string,
  excludeId?: string,
): Promise<string> {
  let base = slugifyTitle(desired);
  let candidate = base;
  for (let i = 0; i < 20; i++) {
    let q = admin.from("magazine_posts").select("id").eq("slug", candidate).limit(1);
    if (excludeId) q = q.neq("id", excludeId);
    const { data } = await q.maybeSingle();
    if (!data) return candidate;
    candidate = `${base}-${i + 2}`;
  }
  return `${base}-${Date.now().toString(36)}`;
}

export async function GET() {
  if (!(await isCurrentUserAdmin())) {
    return NextResponse.json({ message: "권한이 없습니다." }, { status: 403 });
  }
  const admin = createServiceClient();
  if (!admin) return NextResponse.json({ message: "SERVICE_ROLE_KEY 필요" }, { status: 503 });

  await publishDueScheduledMagazine(admin);

  const { data, error } = await admin
    .from("magazine_posts")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ posts: data ?? [] });
}

export async function POST(request: Request) {
  if (!(await isCurrentUserAdmin())) {
    return NextResponse.json({ message: "권한이 없습니다." }, { status: 403 });
  }
  const admin = createServiceClient();
  if (!admin) return NextResponse.json({ message: "SERVICE_ROLE_KEY 필요" }, { status: 503 });

  const user = await getCurrentUser();
  const body = (await request.json()) as Record<string, unknown>;

  const title = String(body.title ?? "").trim();
  if (!title) return NextResponse.json({ message: "제목이 필요합니다." }, { status: 400 });

  const status = (body.status as MagazineStatus) ?? "draft";
  const now = new Date().toISOString();
  const blocks = parseBlocks(body.content_blocks, String(body.content_html ?? ""));
  const slug = await uniqueSlug(
    admin,
    String(body.slug ?? "").trim() || title,
  );

  const { data, error } = await admin
    .from("magazine_posts")
    .insert({
      title,
      slug,
      excerpt: String(body.excerpt ?? "").trim(),
      content_html: String(body.content_html ?? "") || blocksToHtml(blocks),
      content_blocks: blocks,
      cover_url: (body.cover_url as string | null) ?? null,
      cover_credit: String(body.cover_credit ?? "").trim(),
      category: body.category === "news" ? "news" : ("culture" as MagazineCategory),
      status,
      show_on_music: Boolean(body.show_on_music),
      is_cover_story: Boolean(body.is_cover_story),
      hashtags: normalizeHashtags(
        Array.isArray(body.hashtags) ? body.hashtags.map(String) : [],
      ),
      credit_text: String(body.credit_text ?? "").trim(),
      credit_photo: String(body.credit_photo ?? "").trim(),
      credit_edit: String(body.credit_edit ?? "").trim(),
      related_links: parseRelatedLinks(body.related_links),
      published_at:
        status === "published"
          ? (body.published_at as string) || now
          : (body.published_at as string | null) ?? null,
      scheduled_at: status === "scheduled" ? (body.scheduled_at as string | null) ?? null : null,
      author_id: user?.id ?? null,
      updated_at: now,
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });

  await writeAdminAudit({
    module: "magazine",
    action: "create",
    targetType: "magazine_post",
    targetId: data.id,
    summary: `매거진 등록 · ${title} (${status})`,
    meta: { status, category: data.category, slug },
  });

  return NextResponse.json({ post: data });
}
