import type { SupabaseClient } from "@supabase/supabase-js";

export function getAuthCallbackUrl() {
  if (typeof window === "undefined") return "/auth/callback";
  return `${window.location.origin}/auth/callback`;
}

export async function signInWithGoogle(supabase: SupabaseClient) {
  return supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: getAuthCallbackUrl() },
  });
}

export async function signInWithKakao(supabase: SupabaseClient) {
  return supabase.auth.signInWithOAuth({
    provider: "kakao",
    options: {
      redirectTo: getAuthCallbackUrl(),
      queryParams: { lang: "ko" },
    },
  });
}

export function getAuthErrorMessage(message?: string | null): string {
  if (!message) return "로그인에 실패했습니다. 다시 시도해주세요.";

  if (message.includes("KOE205") || message.includes("account_email")) {
    return "카카오 이메일 동의 항목이 설정되지 않았습니다. 카카오 개발자 콘솔에서 account_email 동의항목을 활성화해주세요.";
  }

  if (message.includes("access_denied")) {
    return "카카오 로그인이 취소되었습니다.";
  }

  return message;
}
