import type { SupabaseClient } from "@supabase/supabase-js";

export type AlbumType = "single" | "ep" | "album" | "mix" | "playlist";
export type AlbumPublishMode = "public" | "scheduled" | "private";
export type AlbumPublishStatus = "public" | "scheduled" | "private";

export const ALBUM_TYPE_OPTIONS: { value: AlbumType; label: string }[] = [
  { value: "single", label: "Single" },
  { value: "ep", label: "EP" },
  { value: "album", label: "Album" },
  { value: "mix", label: "Mix" },
  { value: "playlist", label: "Playlist" },
];

export function albumTypeLabel(type: string | null | undefined): string {
  const found = ALBUM_TYPE_OPTIONS.find((o) => o.value === type);
  return found?.label ?? (type?.trim() || "—");
}

export function getAlbumPublishStatus(album: {
  is_published?: boolean | null;
  scheduled_publish_at?: string | null;
}): AlbumPublishStatus {
  if (album.is_published) return "public";
  if (album.scheduled_publish_at) return "scheduled";
  return "private";
}

export function albumPublishStatusLabel(status: AlbumPublishStatus): string {
  switch (status) {
    case "public":
      return "공개";
    case "scheduled":
      return "예약";
    case "private":
      return "비공개";
  }
}

export function inferPublishMode(album: {
  is_published?: boolean | null;
  scheduled_publish_at?: string | null;
}): AlbumPublishMode {
  return getAlbumPublishStatus(album);
}

export function resolvePublishFields(
  mode: AlbumPublishMode,
  scheduledAtLocal: string,
): { is_published: boolean; scheduled_publish_at: string | null } {
  if (mode === "public") {
    return { is_published: true, scheduled_publish_at: null };
  }
  if (mode === "scheduled") {
    const iso = scheduledAtLocal ? new Date(scheduledAtLocal).toISOString() : null;
    return { is_published: false, scheduled_publish_at: iso };
  }
  return { is_published: false, scheduled_publish_at: null };
}

/** datetime-local input value from ISO timestamptz */
export function toDatetimeLocalValue(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Auto-publish albums whose scheduled_publish_at has passed.
 * Call when admin music list / dashboard loads (pass a server Supabase client).
 */
export async function publishDueAlbums(
  client: SupabaseClient | null | undefined,
): Promise<number> {
  const db = client;
  if (!db) return 0;

  const now = new Date().toISOString();
  const { data, error } = await db
    .from("albums")
    .update({ is_published: true })
    .eq("is_published", false)
    .not("scheduled_publish_at", "is", null)
    .lte("scheduled_publish_at", now)
    .select("id");

  if (error) {
    console.error("[publishDueAlbums]", error.message);
    return 0;
  }
  return data?.length ?? 0;
}
