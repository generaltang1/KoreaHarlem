import { Suspense } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AdminArtistsList } from "@/components/admin/AdminArtistsList";
import { Pagination } from "@/components/ui/Pagination";
import { PageSizeSelect } from "@/components/ui/PageSizeSelect";
import {
  getRange,
  getTotalPages,
  pageSizeParams,
  parsePage,
  parsePageSize,
} from "@/lib/pagination";

interface AdminArtistsPageProps {
  searchParams: Promise<{ page?: string; size?: string }>;
}

export default async function AdminArtistsPage({ searchParams }: AdminArtistsPageProps) {
  const { page: pageParam, size: sizeParam } = await searchParams;
  const page = parsePage(pageParam);
  const pageSize = parsePageSize(sizeParam);
  const { from, to } = getRange(page, pageSize);

  const supabase = await createClient();
  const { data: artists, count } = await supabase
    .from("artists")
    .select("id, name, bio, image_url, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  const totalPages = getTotalPages(count ?? 0, pageSize);

  return (
    <div>
      <Suspense fallback={null}>
        <PageSizeSelect />
      </Suspense>
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted">Admin</p>
          <h1 className="mt-1 text-xl font-medium uppercase tracking-wider">아티스트 관리</h1>
        </div>
        <Link
          href="/admin/artists/new"
          className="border border-border px-4 py-2 text-[10px] uppercase tracking-widest transition-colors hover:border-foreground"
        >
          + 새 아티스트 등록
        </Link>
      </div>

      <AdminArtistsList
        artists={(artists ?? []).map((artist) => ({
          id: artist.id,
          name: artist.name,
          bio: artist.bio,
          image_url: artist.image_url,
          created_at: artist.created_at,
        }))}
      />
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        basePath="/admin/artists"
        params={pageSizeParams(pageSize)}
      />
    </div>
  );
}
