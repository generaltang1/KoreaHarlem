"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ThinkPostEditor } from "@/components/think/ThinkPostEditor";

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
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-12 pb-28 md:px-6">
        <Link
          href="/think"
          className="mb-6 inline-flex text-[10px] uppercase tracking-widest text-muted hover:text-foreground"
        >
          ← 목록
        </Link>
        <ThinkPostEditor
          isLoggedIn={isLoggedIn}
          isAdmin={isAdmin}
          memberNickname={memberNickname}
          onSuccess={(postId) => router.push(`/think/${postId}`)}
        />
      </main>
      <Footer />
    </>
  );
}
