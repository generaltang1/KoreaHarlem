import { getCurrentUser, isCurrentUserAdmin } from "@/lib/auth/session";
import { getMemberNickname } from "@/lib/think";
import { ThinkNewPageClient } from "./ThinkNewPageClient";

export default async function ThinkNewPage() {
  const user = await getCurrentUser();
  const isAdmin = await isCurrentUserAdmin();

  return (
    <ThinkNewPageClient
      isLoggedIn={!!user}
      isAdmin={isAdmin}
      memberNickname={user ? getMemberNickname(user) : ""}
    />
  );
}
