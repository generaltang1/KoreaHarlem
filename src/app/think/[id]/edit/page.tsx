import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ThinkShell } from "@/components/think/ThinkShell";
import { ThinkEditClient } from "@/app/think/[id]/edit/ThinkEditClient";
import { createServiceClient } from "@/lib/supabase/admin";
import { getCurrentUser, isCurrentUserAdmin } from "@/lib/auth/session";
import { getMemberNickname } from "@/lib/think";
import { mp } from "@/lib/mypageTheme";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ThinkEditPage({ params }: PageProps) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/think/${id}/edit`)}`);
  }

  const admin = createServiceClient();
  if (!admin) notFound();

  const { data: post } = await admin
    .from("think_posts")
    .select("id, title, content_html, flair, is_notice, user_id")
    .eq("id", id)
    .maybeSingle();

  if (!post) notFound();

  const isAdmin = await isCurrentUserAdmin();
  if (post.user_id !== user.id && !isAdmin) {
    redirect(`/think/${id}`);
  }

  return (
    <ThinkShell maxWidthClass="max-w-3xl">
      <Link
        href={`/think/${id}`}
        className={`mb-6 inline-flex text-[11px] uppercase tracking-widest ${mp.muted} hover:text-[#f4f1ea]`}
      >
        ← 글로
      </Link>
      <ThinkEditClient
        isAdmin={isAdmin}
        memberNickname={getMemberNickname(user)}
        initial={{
          id: post.id,
          title: post.title,
          contentHtml: post.content_html,
          flair: post.flair,
          isNotice: post.is_notice,
        }}
      />
    </ThinkShell>
  );
}
