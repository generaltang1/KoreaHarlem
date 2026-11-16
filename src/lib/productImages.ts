import type { SupabaseClient } from "@supabase/supabase-js";

export const MAX_PRODUCT_IMAGES = 5;

export async function uploadProductImage(
  supabase: SupabaseClient,
  productId: string,
  file: File,
  sortOrder: number,
): Promise<void> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `products/${productId}/${Date.now()}-${sortOrder}.${ext}`;
  const { error: uploadError } = await supabase.storage.from("images").upload(path, file);
  if (uploadError) throw uploadError;

  const { data: urlData } = supabase.storage.from("images").getPublicUrl(path);
  const { error: imgError } = await supabase.from("product_images").insert({
    product_id: productId,
    url: urlData.publicUrl,
    sort_order: sortOrder,
  });
  if (imgError) throw imgError;
}

/** 티켓 라인업 아티스트 사진 — product_images 행 없이 URL만 반환 */
export async function uploadLineupImage(
  supabase: SupabaseClient,
  productKey: string,
  file: File,
): Promise<string> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `products/${productKey}/lineup/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
  const { error: uploadError } = await supabase.storage.from("images").upload(path, file, {
    upsert: false,
  });
  if (uploadError) throw uploadError;
  const { data: urlData } = supabase.storage.from("images").getPublicUrl(path);
  return urlData.publicUrl;
}
