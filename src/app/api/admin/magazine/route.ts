import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { getCurrentUser, isCurrentUserAdmin } from "@/lib/auth/session";
import type { MagazineCategory, MagazineStatus } from "@/lib/magazine";
import { publishDueScheduledMagazine } from "@/lib/magazinePublish";
import { writeAdminAudit } from "@/lib/adminAudit";

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
  const body = (await request.json()) as {
    title?: string;
    excerpt?: string;
    content_html?: string;
    cover_url?: string | null;
    category?: MagazineCategory;
    status?: MagazineStatus;
    show_on_music?: boolean;
    published_at?: string | null;
    scheduled_at?: string | null;
  };

  const title = (body.title ?? "").trim();
  if (!title) return NextResponse.json({ message: "제목이 필요합니다." }, { status: 400 });

  const status = body.status ?? "draft";
  const now = new Date().toISOString();

  const { data, error } = await admin
    .from("magazine_posts")
    .insert({
      title,
      excerpt: (body.excerpt ?? "").trim(),
      content_html: body.content_html ?? "",
      cover_url: body.cover_url ?? null,
      category: body.category === "news" ? "news" : "culture",
      status,
      show_on_music: Boolean(body.show_on_music),
      published_at:
        status === "published" ? body.published_at || now : body.published_at ?? null,
      scheduled_at: status === "scheduled" ? body.scheduled_at ?? null : null,
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
    meta: { status, category: data.category },
  });

  return NextResponse.json({ post: data });
}
