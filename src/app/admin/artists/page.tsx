import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AdminArtistsList } from "@/components/admin/AdminArtistsList";
import { Pagination } from "@/components/ui/Pagination";
import { ListToolbar } from "@/components/ui/ListToolbar";
import { searchArtistsPaged } from "@/lib/albumSearch";
import {
  getRange,
  getTotalPages,
  listParams,
  parsePage,
  parsePageSize,
} from "@/lib/pagination";
import { parseSearchQuery } from "@/lib/search";

interface AdminArtistsPageProps {
  searchParams: Promise<{ page?: string; size?: string; q?: string }>;
}

export default async function AdminArtistsPage({ searchParams }: AdminArtistsPageProps) {
  const { page: pageParam, size: sizeParam, q: qParam } = await searchParams;
  const page = parsePage(pageParam);
  const pageSize = parsePageSize(sizeParam);
  const q = parseSearchQuery(qParam);
  const { from, to } = getRange(page, pageSize);

  const supabase = await createClient();
  const { data: artists, count } = await searchArtistsPaged(supabase, {
    q,
    from,
    to,
    select: "id, name, bio, image_url, created_at",
  });

  const totalPages = getTotalPages(count, pageSize);

  return (
    <div>
      <ListToolbar searchPlaceholder="아티스트명, 소개 검색" />
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted">Admin</p>
          <h1 className="mt-1 text-xl font-medium uppercase tracking-wider">아티스트 관리</h1>
          {q && (
            <p className="mt-2 text-xs text-muted">
              “{q}” 검색 결과 {count}건
            </p>
          )}
        </div>
        <Link
          href="/admin/artists/new"
          className="border border-border px-4 py-2 text-[10px] uppercase tracking-widest transition-colors hover:border-foreground"
        >
          + 새 아티스트 등록
        </Link>
      </div>

      <AdminArtistsList
        artists={artists.map((artist) => ({
          id: artist.id,
          name: artist.name,
          bio: artist.bio ?? null,
          image_url: artist.image_url ?? null,
          created_at: artist.created_at ?? "",
        }))}
      />
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        basePath="/admin/artists"
        params={listParams({ pageSize, q })}
      />
    </div>
  );
}
