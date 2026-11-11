import type { SupabaseClient } from "@supabase/supabase-js";
import { toIlikePattern } from "@/lib/search";

export type AlbumSearchRow = {
  id: string;
  title: string;
  artist_id?: string | null;
  artist_name?: string | null;
  description?: string | null;
  cover_url?: string | null;
  created_at: string;
  album_type?: string | null;
  release_date?: string | null;
  is_published?: boolean | null;
  scheduled_publish_at?: string | null;
  play_count?: number | null;
  download_count?: number | null;
  album_tracks?: { count: number }[] | null;
};

export type AlbumPublishFilter = "all" | "public" | "scheduled" | "private";

export type ArtistSearchRow = {
  id: string;
  name: string;
  name_en?: string | null;
  genre?: string | null;
  bio?: string | null;
  image_url?: string | null;
  created_at?: string;
};

/**
 * Search albums by artist_name OR album title OR track title (returns albums).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyPublishFilter(query: any, status?: AlbumPublishFilter) {
  if (!status || status === "all") return query;
  if (status === "public") return query.eq("is_published", true);
  if (status === "scheduled") {
    return query.eq("is_published", false).not("scheduled_publish_at", "is", null);
  }
  return query.eq("is_published", false).is("scheduled_publish_at", null);
}

export async function searchAlbumsPaged(
  supabase: SupabaseClient,
  options: {
    q?: string;
    from: number;
    to: number;
    select?: string;
    publishStatus?: AlbumPublishFilter;
  },
): Promise<{ data: AlbumSearchRow[]; count: number }> {
  const select = options.select ?? "*, album_tracks(count)";
  const q = options.q?.trim() ?? "";
  const status = options.publishStatus ?? "all";

  if (!q) {
    const query = applyPublishFilter(
      supabase
        .from("albums")
        .select(select, { count: "exact" })
        .order("created_at", { ascending: false }),
      status,
    );
    const { data, count, error } = await query.range(options.from, options.to);
    if (error) throw error;
    return { data: (data ?? []) as unknown as AlbumSearchRow[], count: count ?? 0 };
  }

  const pattern = toIlikePattern(q);
  const quoted = `"${pattern}"`;

  const { data: trackHits, error: trackError } = await supabase
    .from("album_tracks")
    .select("album_id")
    .ilike("title", pattern);

  if (trackError) throw trackError;

  const albumIdsFromTracks = [
    ...new Set(
      (trackHits ?? [])
        .map((row) => row.album_id as string)
        .filter(Boolean),
    ),
  ];

  const orParts = [`artist_name.ilike.${quoted}`, `title.ilike.${quoted}`];
  if (albumIdsFromTracks.length > 0) {
    orParts.push(`id.in.(${albumIdsFromTracks.join(",")})`);
  }

  const query = applyPublishFilter(
    supabase
      .from("albums")
      .select(select, { count: "exact" })
      .or(orParts.join(","))
      .order("created_at", { ascending: false }),
    status,
  );
  const { data, count, error } = await query.range(options.from, options.to);

  if (error) throw error;
  return { data: (data ?? []) as unknown as AlbumSearchRow[], count: count ?? 0 };
}

export async function searchArtistsPaged(
  supabase: SupabaseClient,
  options: {
    q?: string;
    from: number;
    to: number;
    select?: string;
  },
): Promise<{ data: ArtistSearchRow[]; count: number }> {
  const select = options.select ?? "*";
  const q = options.q?.trim() ?? "";

  let query = supabase
    .from("artists")
    .select(select, { count: "exact" })
    .order("created_at", { ascending: false });

  if (q) {
    const pattern = toIlikePattern(q);
    query = query.or(
      `name.ilike."${pattern}",name_en.ilike."${pattern}",genre.ilike."${pattern}",bio.ilike."${pattern}"`,
    );
  }

  const { data, count, error } = await query.range(options.from, options.to);
  if (error) throw error;
  return { data: (data ?? []) as unknown as ArtistSearchRow[], count: count ?? 0 };
}
