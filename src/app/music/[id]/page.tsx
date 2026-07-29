import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function LegacyMusicRedirectPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: album } = await supabase.from("albums").select("id").eq("id", id).maybeSingle();
  if (album) {
    redirect(`/music/album/${id}`);
  }

  redirect("/works?category=music");
}
