import type { MagazineListItem, MagazinePost } from "@/lib/magazine";
import { createServiceClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { publishDueScheduledMagazine } from "@/lib/magazinePublish";

export type { MagazineListItem } from "@/lib/magazine";

export const MAGAZINE_LIST_SELECT =
  "id, title, slug, excerpt, cover_url, cover_credit, category, status, show_on_music, is_cover_story, hashtags, credit_text, credit_photo, credit_edit, related_links, view_count, published_at, scheduled_at, author_id, created_at, updated_at";

export const MAGAZINE_DETAIL_SELECT = `${MAGAZINE_LIST_SELECT}, content_html, content_blocks`;

export async function ensureMagazinePublished() {
  const service = createServiceClient();
  if (service) await publishDueScheduledMagazine(service);
}

export async function fetchPublishedMagazine(limit = 60): Promise<MagazineListItem[]> {
  await ensureMagazinePublished();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("magazine_posts")
    .select(MAGAZINE_LIST_SELECT)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(limit);
  if (error) return [];
  return (data ?? []) as MagazineListItem[];
}

export async function fetchMagazineBySlugOrId(
  key: string,
): Promise<MagazinePost | null> {
  await ensureMagazinePublished();
  const supabase = await createClient();
  const decoded = decodeURIComponent(key);

  const bySlug = await supabase
    .from("magazine_posts")
    .select(MAGAZINE_DETAIL_SELECT)
    .eq("slug", decoded)
    .eq("status", "published")
    .maybeSingle();
  if (!bySlug.error && bySlug.data) return bySlug.data as MagazinePost;

  const byId = await supabase
    .from("magazine_posts")
    .select(MAGAZINE_DETAIL_SELECT)
    .eq("id", decoded)
    .eq("status", "published")
    .maybeSingle();
  if (!byId.error && byId.data) return byId.data as MagazinePost;
  return null;
}

export async function fetchMagazineAdminById(id: string): Promise<MagazinePost | null> {
  const service = createServiceClient();
  if (!service) return null;
  const { data, error } = await service
    .from("magazine_posts")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return data as MagazinePost;
}
