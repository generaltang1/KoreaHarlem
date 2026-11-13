import {
  normalizeHashtags,
  type MagazineBlock,
  type MagazineRelatedLink,
} from "@/lib/magazineBlocks";

export type MagazineCategory = "culture" | "news";
export type MagazineStatus = "draft" | "scheduled" | "published" | "archived";

export type MagazinePost = {
  id: string;
  title: string;
  slug: string | null;
  excerpt: string;
  content_html: string;
  content_blocks?: MagazineBlock[] | unknown;
  cover_url: string | null;
  cover_credit?: string;
  category: MagazineCategory;
  status: MagazineStatus;
  show_on_music: boolean;
  is_cover_story?: boolean;
  hashtags?: string[];
  credit_text?: string;
  credit_photo?: string;
  credit_edit?: string;
  related_links?: MagazineRelatedLink[] | unknown;
  view_count?: number;
  published_at: string | null;
  scheduled_at: string | null;
  author_id: string | null;
  created_at: string;
  updated_at: string;
};

/** 목록·카드용 (클라이언트 안전) */
export type MagazineListItem = Pick<
  MagazinePost,
  | "id"
  | "title"
  | "slug"
  | "excerpt"
  | "cover_url"
  | "cover_credit"
  | "category"
  | "status"
  | "show_on_music"
  | "is_cover_story"
  | "hashtags"
  | "credit_text"
  | "credit_photo"
  | "credit_edit"
  | "related_links"
  | "view_count"
  | "published_at"
  | "scheduled_at"
  | "author_id"
  | "created_at"
  | "updated_at"
>;

export function formatMagDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}.${m}.${day}`;
}

export function collectTagCounts(
  posts: MagazineListItem[],
): { tag: string; count: number }[] {
  const map = new Map<string, number>();
  for (const p of posts) {
    for (const t of normalizeHashtags(p.hashtags ?? [])) {
      map.set(t, (map.get(t) ?? 0) + 1);
    }
  }
  return [...map.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag, "ko"));
}

export function filterByTag(
  posts: MagazineListItem[],
  tag: string | null,
): MagazineListItem[] {
  if (!tag) return posts;
  const needle = tag.replace(/^#/, "").toLowerCase();
  return posts.filter((p) =>
    (p.hashtags ?? []).some((t) => t.replace(/^#/, "").toLowerCase() === needle),
  );
}

export function magazineCategoryLabel(category: string): string {
  switch (category) {
    case "culture":
      return "Culture";
    case "news":
      return "News";
    default:
      return category;
  }
}

export function magazineStatusLabel(status: string): string {
  switch (status) {
    case "draft":
      return "임시저장";
    case "scheduled":
      return "예약";
    case "published":
      return "발행";
    case "archived":
      return "보관";
    default:
      return status;
  }
}

export function magazinePublicPath(post: {
  slug?: string | null;
  id?: string;
  category?: string | null;
}): string {
  const slug = (post.slug ?? "").trim();
  if (slug) return `/magazine/${encodeURIComponent(slug)}`;
  if (post.id) return `/magazine/${encodeURIComponent(post.id)}`;
  return "/magazine";
}
