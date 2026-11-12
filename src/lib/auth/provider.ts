/** OAuth / 이메일 가입 수단 감지 */

export type AuthProviderKind = "email" | "kakao" | "google" | "unknown";

export function detectAuthProvider(user: {
  app_metadata?: { provider?: string; providers?: string[] };
  identities?: { provider?: string }[];
}): AuthProviderKind {
  const providers = new Set<string>();
  const metaProvider = user.app_metadata?.provider;
  if (metaProvider) providers.add(metaProvider.toLowerCase());
  for (const p of user.app_metadata?.providers ?? []) {
    if (p) providers.add(String(p).toLowerCase());
  }
  for (const id of user.identities ?? []) {
    if (id.provider) providers.add(id.provider.toLowerCase());
  }

  if (providers.has("kakao")) return "kakao";
  if (providers.has("google")) return "google";
  if (providers.has("email") || providers.has("password")) return "email";
  return "email";
}

export function authProviderLabel(kind: AuthProviderKind): string {
  switch (kind) {
    case "kakao":
      return "카카오";
    case "google":
      return "Google";
    case "email":
      return "이메일";
    default:
      return "계정";
  }
}
