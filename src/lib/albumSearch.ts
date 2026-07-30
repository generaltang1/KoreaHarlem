import { toIlikePattern } from "@/lib/search";

type QueryClient = {
  from: (table: string) => {
    select: (
      columns: string,
      options?: { count?: "exact" },
    ) => any;
  };
};

export type AlbumSearchRow = {
  id: string;
  title: string;
  artist_id?: string | null;
  artist_name?: string | null;
  description?: string | null;
  cover_url?: string | null;
  created_at: string;
  album_tracks?: { count: number }[] | null;
};

export type ArtistSearchRow = {
  id: string;
  name: string;
  bio?: string | null;
  image_url?: string | null;
  created_at?: string;
};

/**
 * Search albums by artist_name OR album title OR track title (returns albums).
 */
export async function searchAlbumsPaged(
  supabase: QueryClient,
  options: {
    q?: string;
    from: number;
    to: number;
    select?: string;
  },
): Promise<{ data: AlbumSearchRow[]; count: number }> {
  const select = options.select ?? "*, album_tracks(count)";
  const q = options.q?.trim() ?? "";

  if (!q) {
    const { data, count, error } = await supabase
      .from("albums")
      .select(select, { count: "exact" })
      .order("created_at", { ascending: false })
      .range(options.from, options.to);
    if (error) throw error;
    return { data: (data ?? []) as AlbumSearchRow[], count: count ?? 0 };
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
      ((trackHits ?? []) as { album_id: string }[])
        .map((row) => row.album_id)
        .filter(Boolean),
    ),
  ];

  const orParts = [`artist_name.ilike.${quoted}`, `title.ilike.${quoted}`];
  if (albumIdsFromTracks.length > 0) {
    orParts.push(`id.in.(${albumIdsFromTracks.join(",")})`);
  }

  const { data, count, error } = await supabase
    .from("albums")
    .select(select, { count: "exact" })
    .or(orParts.join(","))
    .order("created_at", { ascending: false })
    .range(options.from, options.to);

  if (error) throw error;
  return { data: (data ?? []) as AlbumSearchRow[], count: count ?? 0 };
}

export async function searchArtistsPaged(
  supabase: QueryClient,
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
    query = query.or(`name.ilike."${pattern}",bio.ilike."${pattern}"`);
  }

  const { data, count, error } = await query.range(options.from, options.to);
  if (error) throw error;
  return { data: (data ?? []) as ArtistSearchRow[], count: count ?? 0 };
}
