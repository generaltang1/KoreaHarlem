import type { SupabaseClient } from "@supabase/supabase-js";

/** status=scheduled 이고 scheduled_at <= now 인 글을 published 로 전환. */
export async function publishDueScheduledMagazine(
  client: SupabaseClient,
): Promise<number> {
  const now = new Date().toISOString();
  const { data, error } = await client
    .from("magazine_posts")
    .update({
      status: "published",
      published_at: now,
      updated_at: now,
    })
    .eq("status", "scheduled")
    .lte("scheduled_at", now)
    .select("id");

  if (error) {
    console.error("[magazine publishDue]", error.message);
    return 0;
  }
  return data?.length ?? 0;
}
