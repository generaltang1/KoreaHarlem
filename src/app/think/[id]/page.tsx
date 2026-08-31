import { notFound } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ThinkPostDetailView } from "@/components/think/ThinkPostDetailView";
import { createServiceClient } from "@/lib/supabase/admin";
import { formatThinkAuthorDisplay, type ThinkPostDetail } from "@/lib/think";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ThinkPostPage({ params }: PageProps) {
  const { id } = await params;
  const admin = createServiceClient();
  if (!admin) notFound();

  const { data: post } = await admin.from("think_posts").select("*").eq("id", id).maybeSingle();
  if (!post) notFound();

  await admin
    .from("think_posts")
    .update({ view_count: (post.view_count ?? 0) + 1 })
    .eq("id", id);

  const viewCount = (post.view_count ?? 0) + 1;

  const [{ data: attachments }, { data: youtubeVideos }] = await Promise.all([
    admin.from("think_post_attachments").select("*").eq("post_id", id).order("sort_order"),
    admin.from("think_post_youtube").select("*").eq("post_id", id).order("sort_order"),
  ]);

  const detail: ThinkPostDetail = {
    ...post,
    view_count: viewCount,
    author_display: formatThinkAuthorDisplay(post),
    attachments: attachments ?? [],
    youtube_videos: youtubeVideos ?? [],
  };

  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-12 pb-28 md:px-6">
        <ThinkPostDetailView initialPost={detail} />
      </main>
      <Footer />
    </>
  );
}
