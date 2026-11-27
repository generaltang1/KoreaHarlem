import { redirect } from "next/navigation";
import { MypageShell } from "@/components/mypage/MypageShell";
import { MyThinkClient } from "@/app/mypage/think/MyThinkClient";
import { getCurrentUser } from "@/lib/auth/session";

export default async function MyThinkPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent("/mypage/think")}`);
  }

  return (
    <MypageShell title="내 THINK" subtitle="내가 쓴 글">
      <MyThinkClient />
    </MypageShell>
  );
}
