import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";

type RouteContext = { params: Promise<{ slug: string }> };

export async function POST(_request: Request, context: RouteContext) {
  const admin = createServiceClient();
  if (!admin) return NextResponse.json({ ok: false }, { status: 503 });

  const { slug } = await context.params;
  const key = decodeURIComponent(slug);

  let post: { id: string; view_count: number | null } | null = null;

  const bySlug = await admin
    .from("magazine_posts")
    .select("id, view_count")
    .eq("slug", key)
    .eq("status", "published")
    .maybeSingle();
  if (!bySlug.error && bySlug.data) {
    post = bySlug.data;
  } else {
    const byId = await admin
      .from("magazine_posts")
      .select("id, view_count")
      .eq("id", key)
      .eq("status", "published")
      .maybeSingle();
    if (!byId.error && byId.data) post = byId.data;
  }

  if (!post) return NextResponse.json({ ok: false }, { status: 404 });

  await admin
    .from("magazine_posts")
    .update({
      view_count: (post.view_count ?? 0) + 1,
      updated_at: new Date().toISOString(),
    })
    .eq("id", post.id);

  return NextResponse.json({ ok: true });
}
