import type { SupabaseClient } from "@supabase/supabase-js";

/** 로그인 직후 차단 회원이면 세션 종료 (클라이언트/서버 공용) */
export async function enforceNotBlocked(
  supabase: SupabaseClient,
): Promise<{ blocked: boolean }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { blocked: false };
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_blocked")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.is_blocked) {
    await supabase.auth.signOut();
    return { blocked: true };
  }
  return { blocked: false };
}
