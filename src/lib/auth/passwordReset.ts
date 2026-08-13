import type { SupabaseClient } from "@supabase/supabase-js";

/** PKCE recovery — Supabase 이메일 템플릿의 `next` 파라미터로 사용 */
export function getResetPasswordRedirectPath() {
  return "/auth/reset-password";
}

export function getPasswordResetConfirmPath() {
  return `/auth/confirm?next=${encodeURIComponent(getResetPasswordRedirectPath())}`;
}

export function getPasswordResetRedirectUrl(origin: string) {
  return `${origin}${getResetPasswordRedirectPath()}`;
}

export async function requestPasswordReset(supabase: SupabaseClient, email: string) {
  const redirectTo =
    typeof window !== "undefined"
      ? getPasswordResetRedirectUrl(window.location.origin)
      : getResetPasswordRedirectPath();

  return supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });
}
