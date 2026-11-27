"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ThinkShell } from "@/components/think/ThinkShell";
import { ThinkPostEditor } from "@/components/think/ThinkPostEditor";
import { mp } from "@/lib/mypageTheme";

type ThinkNewPageClientProps = {
  isLoggedIn: boolean;
  isAdmin: boolean;
  memberNickname: string;
};

export function ThinkNewPageClient({
  isLoggedIn,
  isAdmin,
  memberNickname,
}: ThinkNewPageClientProps) {
  const router = useRouter();

  return (
    <ThinkShell maxWidthClass="max-w-3xl">
      <Link
        href="/think"
        className={`mb-6 inline-flex text-[11px] uppercase tracking-widest ${mp.muted} hover:text-[#f4f1ea]`}
      >
        ← 목록
      </Link>
      <ThinkPostEditor
        isLoggedIn={isLoggedIn}
        isAdmin={isAdmin}
        memberNickname={memberNickname}
        onSuccess={(postId) => router.push(`/think/${postId}`)}
      />
    </ThinkShell>
  );
}
