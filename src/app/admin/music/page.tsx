import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { AdminMusicList } from "@/components/admin/AdminMusicList";
import { AdminKpiRow, AdminPageHeader, AdminPrimaryButton } from "@/components/admin/AdminPageHeader";
import { Pagination } from "@/components/ui/Pagination";
import { ListToolbar } from "@/components/ui/ListToolbar";
import {
  albumPublishStatusLabel,
  albumTypeLabel,
  getAlbumPublishStatus,
  publishDueAlbums,
  type AlbumPublishStatus,
} from "@/lib/albumPublish";
import { searchAlbumsPaged, type AlbumPublishFilter } from "@/lib/albumSearch";
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
  searchParams: Promise<{ page?: string; size?: string; q?: string; status?: string }>;
}

const FILTER_TABS: { key: AlbumPublishFilter; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "public", label: "공개" },
  { key: "scheduled", label: "예약" },
  { key: "private", label: "비공개" },
];

function parsePublishFilter(value?: string): AlbumPublishFilter {
  if (value === "public" || value === "scheduled" || value === "private") return value;
  return "all";
}

export default async function AdminMusicPage({ searchParams }: AdminMusicPageProps) {
  const { page: pageParam, size: sizeParam, q: qParam, status: statusParam } = await searchParams;
  const page = parsePage(pageParam);
  const pageSize = parsePageSize(sizeParam);
  const q = parseSearchQuery(qParam);
  const status = parsePublishFilter(statusParam);
  const { from, to } = getRange(page, pageSize);

  const supabase = await createClient();
  const admin = createServiceClient();
  await publishDueAlbums(admin ?? supabase);

  const selectCols =
    "id, title, artist_name, created_at, album_type, release_date, is_published, scheduled_publish_at, play_count, download_count, album_tracks(count)";

  let albums;
  let count = 0;
  try {
    const result = await searchAlbumsPaged(supabase, {
      q,
      from,
      to,
      select: selectCols,
      publishStatus: status,
    });
    albums = result.data;
    count = result.count;
  } catch {
    const result = await searchAlbumsPaged(supabase, {
      q,
      from,
      to,
      select: "id, title, artist_name, created_at, album_tracks(count)",
      publishStatus: "all",
    });
    albums = result.data;
    count = result.count;
  }

  const [{ count: albumTotal }, { count: trackTotal }] = await Promise.all([
    supabase.from("albums").select("id", { count: "exact", head: true }),
    supabase.from("album_tracks").select("id", { count: "exact", head: true }),
  ]);

  const scheduledRes = await supabase
    .from("albums")
    .select("id", { count: "exact", head: true })
    .eq("is_published", false)
    .not("scheduled_publish_at", "is", null);
  const scheduledTotal = scheduledRes.error ? 0 : (scheduledRes.count ?? 0);

  const albumList = albums.map((album) => {
    const publishStatus: AlbumPublishStatus = getAlbumPublishStatus({
      is_published: album.is_published,
      scheduled_publish_at: album.scheduled_publish_at,
    });
    return {
      id: album.id,
      title: album.title,
      artist: getAlbumArtistName(album),
      track_count: album.album_tracks?.[0]?.count ?? 0,
      created_at: album.created_at,
      album_type: album.album_type ?? null,
      album_type_label: albumTypeLabel(album.album_type),
      release_date: album.release_date ?? null,
      publish_status: publishStatus,
      publish_status_label: albumPublishStatusLabel(publishStatus),
      play_count: Number(album.play_count ?? 0),
      download_count: Number(album.download_count ?? 0),
      scheduled_publish_at: album.scheduled_publish_at ?? null,
    };
  });

  const totalPages = getTotalPages(count, pageSize);
  const statusParamForList = status === "all" ? undefined : status;

  return (
    <div>
      <AdminPageHeader
        title="음악 관리"
        description="앨범 · 공개 상태 · 재생/다운로드"
        actions={<AdminPrimaryButton href="/admin/music/new">+ 새 앨범 등록</AdminPrimaryButton>}
      />

      <AdminKpiRow
        items={[
          { label: "전체 앨범", value: albumTotal ?? 0 },
          { label: "전체 음원", value: trackTotal ?? 0 },
          { label: "예약 공개", value: scheduledTotal ?? 0 },
        ]}
      />

      <ListToolbar searchPlaceholder="아티스트명, 앨범제목, 곡제목 검색" />

      <div className="mb-4 flex flex-wrap gap-2">
        {FILTER_TABS.map((tab) => {
          const href =
            tab.key === "all"
              ? `/admin/music${q ? `?q=${encodeURIComponent(q)}` : ""}`
              : `/admin/music?status=${tab.key}${q ? `&q=${encodeURIComponent(q)}` : ""}`;
          const active = status === tab.key;
          return (
            <Link
              key={tab.key}
              href={href}
              className={
                active
                  ? "border border-foreground bg-foreground px-3 py-1.5 text-[10px] uppercase tracking-widest text-background"
                  : "border border-border px-3 py-1.5 text-[10px] uppercase tracking-widest text-muted hover:border-foreground hover:text-foreground"
              }
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {q ? (
        <p className="mb-4 text-xs text-muted">
          “{q}” 검색 결과 {count}건
        </p>
      ) : null}

      <AdminMusicList albums={albumList} />
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        basePath="/admin/music"
        params={listParams({ pageSize, q, status: statusParamForList })}
      />
    </div>
  );
}
