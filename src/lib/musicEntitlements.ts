import type { SupabaseClient } from "@supabase/supabase-js";

type OrderItemRow = {
  item_kind?: string | null;
  album_id?: string | null;
  track_id?: string | null;
};

export async function grantMusicEntitlementsForOrder(
  admin: SupabaseClient,
  orderId: string,
) {
  const { data: order } = await admin
    .from("orders")
    .select("id, user_id, status")
    .eq("id", orderId)
    .maybeSingle();

  if (!order?.user_id) return;
  if (order.status !== "paid") return;

  const { data: items } = await admin
    .from("order_items")
    .select("item_kind, album_id, track_id")
    .eq("order_id", orderId);

  const rows = ((items ?? []) as OrderItemRow[]).filter(
    (item) => item.item_kind === "digital_album" || item.item_kind === "digital_track",
  );

  for (const item of rows) {
    const { error } =
      item.item_kind === "digital_album" && item.album_id
        ? await admin.from("music_entitlements").insert({
            user_id: order.user_id,
            order_id: orderId,
            kind: "album",
            album_id: item.album_id,
            track_id: null,
          })
        : item.item_kind === "digital_track" && item.track_id
          ? await admin.from("music_entitlements").insert({
              user_id: order.user_id,
              order_id: orderId,
              kind: "track",
              album_id: item.album_id ?? null,
              track_id: item.track_id,
            })
          : { error: null };
    if (error && !/duplicate|unique/i.test(error.message)) {
      console.error("grantMusicEntitlements:", error.message);
    }
  }
}

export function isDigitalCartKind(kind?: string | null) {
  return kind === "digital_album" || kind === "digital_track";
}
