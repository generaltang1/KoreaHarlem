import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AdminMusicList } from "@/components/admin/AdminMusicList";
import { Pagination } from "@/components/ui/Pagination";
import { ListToolbar } from "@/components/ui/ListToolbar";
import { searchAlbumsPaged } from "@/lib/albumSearch";
import { getAlbumArtistName } from "@/lib/albums";
import {
  getRange,
  getTotalPages,
  listParams,
  parsePage,
  parsePageSize,
} from "@/lib/pagination";
import { parseSearchQuery } from "@/lib/search";

interface AdminMusicPageProps {
  searchParams: Promise<{ page?: string; size?: string; q?: string }>;
}

export default async function AdminMusicPage({ searchParams }: AdminMusicPageProps) {
  const { page: pageParam, size: sizeParam, q: qParam } = await searchParams;
  const page = parsePage(pageParam);
  const pageSize = parsePageSize(sizeParam);
  const q = parseSearchQuery(qParam);
  const { from, to } = getRange(page, pageSize);

  const supabase = await createClient();
  const { data: albums, count } = await searchAlbumsPaged(supabase, {
    q,
    from,
    to,
    select: "id, title, artist_name, created_at, album_tracks(count)",
  });

  const albumList = albums.map((album) => ({
    id: album.id,
    title: album.title,
    artist: getAlbumArtistName(album),
    track_count: album.album_tracks?.[0]?.count ?? 0,
    created_at: album.created_at,
  }));

  const totalPages = getTotalPages(count, pageSize);

  return (
    <div>
      <ListToolbar searchPlaceholder="아티스트명, 앨범제목, 곡제목 검색" />
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted">Admin</p>
          <h1 className="mt-1 text-xl font-medium uppercase tracking-wider">음악 관리</h1>
          {q && (
            <p className="mt-2 text-xs text-muted">
              “{q}” 검색 결과 {count}건
            </p>
          )}
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
        params={listParams({ pageSize, q })}
      />
    </div>
  );
}
