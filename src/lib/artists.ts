import { createClient } from "@/lib/supabase/server";
import type { DbAlbum } from "@/lib/albums";
import { getRange } from "@/lib/pagination";

export interface DbArtist {
  id: string;
  name: string;
  bio?: string | null;
  image_url?: string | null;
  created_at: string;
}

export async function getArtistById(id: string): Promise<DbArtist | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("artists")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  return data as DbArtist;
}

export async function getAlbumsByArtistPaged(
  artist: Pick<DbArtist, "id" | "name">,
  page: number,
  pageSize: number,
): Promise<{ albums: DbAlbum[]; count: number }> {
  const supabase = await createClient();
  const { from, to } = getRange(page, pageSize);

  const byId = await supabase
    .from("albums")
    .select("*", { count: "exact" })
    .eq("artist_id", artist.id)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (!byId.error && (byId.count ?? 0) > 0) {
    return { albums: (byId.data ?? []) as DbAlbum[], count: byId.count ?? 0 };
  }

  const byName = await supabase
    .from("albums")
    .select("*", { count: "exact" })
    .eq("artist_name", artist.name)
    .order("created_at", { ascending: false })
    .range(from, to);

  return {
    albums: (byName.data ?? []) as DbAlbum[],
    count: byName.count ?? 0,
  };
}
