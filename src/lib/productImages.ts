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
