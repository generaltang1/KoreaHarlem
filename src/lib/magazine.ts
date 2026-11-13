import type { MagazineBlock, MagazineRelatedLink } from "@/lib/magazineBlocks";

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
