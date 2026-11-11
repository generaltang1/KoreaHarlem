import type { SupabaseClient } from "@supabase/supabase-js";
import { createServiceClient } from "@/lib/supabase/admin";

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

async function bumpDailyStat(
  admin: SupabaseClient,
  field: "stream_count" | "download_count",
) {
  const day = todayKey();
  const { data: existing } = await admin
    .from("music_daily_stats")
    .select("day, stream_count, download_count")
    .eq("day", day)
    .maybeSingle();

  if (existing) {
    await admin
      .from("music_daily_stats")
      .update({ [field]: Number(existing[field] ?? 0) + 1 })
      .eq("day", day);
    return;
  }

  await admin.from("music_daily_stats").insert({
    day,
    stream_count: field === "stream_count" ? 1 : 0,
    download_count: field === "download_count" ? 1 : 0,
  });
}

export async function incrementTrackPlay(trackId: string): Promise<boolean> {
  const admin = createServiceClient();
  if (!admin) return false;

  const { data: track } = await admin
    .from("album_tracks")
    .select("id, album_id, play_count")
    .eq("id", trackId)
    .maybeSingle();

  if (!track) return false;

  await admin
    .from("album_tracks")
    .update({ play_count: Number(track.play_count ?? 0) + 1 })
    .eq("id", track.id);

  if (track.album_id) {
    const { data: album } = await admin
      .from("albums")
      .select("id, play_count")
      .eq("id", track.album_id)
      .maybeSingle();
    if (album) {
      await admin
        .from("albums")
        .update({ play_count: Number(album.play_count ?? 0) + 1 })
        .eq("id", album.id);
    }
  }

  await bumpDailyStat(admin, "stream_count");
  return true;
}

export async function incrementTrackDownload(trackId: string): Promise<boolean> {
  const admin = createServiceClient();
  if (!admin) return false;

  const { data: track } = await admin
    .from("album_tracks")
    .select("id, album_id, download_count")
    .eq("id", trackId)
    .maybeSingle();

  if (!track) return false;

  await admin
    .from("album_tracks")
    .update({ download_count: Number(track.download_count ?? 0) + 1 })
    .eq("id", track.id);

  if (track.album_id) {
    const { data: album } = await admin
      .from("albums")
      .select("id, download_count")
      .eq("id", track.album_id)
      .maybeSingle();
    if (album) {
      await admin
        .from("albums")
        .update({ download_count: Number(album.download_count ?? 0) + 1 })
        .eq("id", album.id);
    }
  }

  await bumpDailyStat(admin, "download_count");
  return true;
}
