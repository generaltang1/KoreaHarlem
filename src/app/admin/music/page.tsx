import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AdminMusicList } from "@/components/admin/AdminMusicList";
import { getArtistName } from "@/lib/tracks";

export default async function AdminMusicPage() {
  const supabase = await createClient();
  const { data: tracks } = await supabase
    .from("tracks")
    .select("id, title, created_at, artists(name)")
    .order("created_at", { ascending: false });

  const trackList = (tracks ?? []).map((track) => ({
    id: track.id,
    title: track.title,
    artist: getArtistName(track.artists),
    created_at: track.created_at,
  }));

  return (
    <div>
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted">Admin</p>
          <h1 className="mt-1 text-xl font-medium uppercase tracking-wider">음악 관리</h1>
        </div>
        <Link
          href="/admin/music/new"
          className="border border-border px-4 py-2 text-[10px] uppercase tracking-widest transition-colors hover:border-foreground"
        >
          + 새 곡 등록
        </Link>
      </div>

      <AdminMusicList tracks={trackList} />
    </div>
  );
}
