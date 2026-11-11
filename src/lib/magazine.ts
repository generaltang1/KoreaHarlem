export type MagazineCategory = "culture" | "news";
export type MagazineStatus = "draft" | "scheduled" | "published" | "archived";

export type MagazinePost = {
  id: string;
  title: string;
  slug: string | null;
  excerpt: string;
  content_html: string;
  cover_url: string | null;
  category: MagazineCategory;
  status: MagazineStatus;
  show_on_music: boolean;
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
