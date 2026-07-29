import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AdminMusicList } from "@/components/admin/AdminMusicList";
import { Pagination } from "@/components/ui/Pagination";
import { getAlbumArtistName } from "@/lib/albums";
import {
  ADMIN_PAGE_SIZE,
  getRange,
  getTotalPages,
  parsePage,
} from "@/lib/pagination";

interface AdminMusicPageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function AdminMusicPage({ searchParams }: AdminMusicPageProps) {
  const { page: pageParam } = await searchParams;
  const page = parsePage(pageParam);
  const { from, to } = getRange(page, ADMIN_PAGE_SIZE);

  const supabase = await createClient();
  const { data: albums, count } = await supabase
    .from("albums")
    .select("id, title, artist_name, created_at, album_tracks(count)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  const albumList = (albums ?? []).map((album) => ({
    id: album.id,
    title: album.title,
    artist: getAlbumArtistName(album),
    track_count:
      (album.album_tracks as { count: number }[] | null)?.[0]?.count ?? 0,
    created_at: album.created_at,
  }));

  const totalPages = getTotalPages(count ?? 0, ADMIN_PAGE_SIZE);

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
          + 새 앨범 등록
        </Link>
      </div>

      <AdminMusicList albums={albumList} />
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        basePath="/admin/music"
      />
    </div>
  );
}
