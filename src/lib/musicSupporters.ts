import type { SupabaseClient } from "@supabase/supabase-js";

export type AlbumSupporterPublic = {
  id: string;
  display_name: string;
  comment: string | null;
};

export async function fetchPublicAlbumSupporters(
  supabase: SupabaseClient,
  albumId: string,
): Promise<AlbumSupporterPublic[]> {
  const { data, error } = await supabase
    .from("album_supporters")
    .select("id, display_name, comment")
    .eq("album_id", albumId)
    .eq("is_public", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    if (/album_supporters|does not exist|schema cache/i.test(error.message)) {
      return [];
    }
    console.error("[album supporters]", error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    display_name: row.display_name,
    comment: row.comment,
  }));
}

export function supporterInitials(name: string): string {
  const t = name.trim();
  if (!t) return "?";
  const parts = t.split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
  }
  return t.slice(0, 2).toUpperCase();
}
