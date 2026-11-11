import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/admin";
import { AdminKpiRow, AdminPageHeader } from "@/components/admin/AdminPageHeader";

function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function daysAgo(n: number) {
  const x = startOfDay();
  x.setDate(x.getDate() - n);
  return x;
}

function dayKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default async function ArtistsDashboardPage() {
  const admin = createServiceClient();

  if (!admin) {
    return (
      <div>
        <AdminPageHeader title="아티스트 대시보드" description="SERVICE_ROLE_KEY가 필요합니다." />
      </div>
    );
  }

  const today = dayKey(startOfDay());
  const since7 = dayKey(daysAgo(6));

  const [
    { count: artistCount },
    { count: trackCount },
    { data: todayStats },
    { data: weekStats },
    { count: reviewCount },
    { data: recentArtists },
  ] = await Promise.all([
    admin.from("artists").select("id", { count: "exact", head: true }),
    admin.from("album_tracks").select("id", { count: "exact", head: true }),
    admin
      .from("music_daily_stats")
      .select("stream_count, download_count")
      .eq("day", today)
      .maybeSingle(),
    admin
      .from("music_daily_stats")
      .select("day, stream_count, download_count")
      .gte("day", since7)
      .lte("day", today)
      .order("day", { ascending: true }),
    admin.from("product_reviews").select("id", { count: "exact", head: true }),
    admin
      .from("artists")
      .select("id, name, name_en, genre, created_at")
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const todayStreams = Number(todayStats?.stream_count ?? 0);
  const todayDownloads = Number(todayStats?.download_count ?? 0);

  const streamByDay = new Map<string, number>();
  for (let i = 6; i >= 0; i--) {
    streamByDay.set(dayKey(daysAgo(i)), 0);
  }
  for (const row of weekStats ?? []) {
    const key = String(row.day).slice(0, 10);
    if (!streamByDay.has(key)) continue;
    streamByDay.set(key, Number(row.stream_count ?? 0));
  }
  const streamSeries = [...streamByDay.entries()];
  const maxStream = Math.max(1, ...streamSeries.map(([, v]) => v));

  return (
    <div>
      <AdminPageHeader
        title="아티스트 대시보드"
        description="아티스트 · 음원 · 스트리밍 현황"
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/artists/new"
              className="rounded-md bg-neutral-900 px-3 py-2 text-xs uppercase tracking-widest text-white"
            >
              + 아티스트 등록
            </Link>
            <Link
              href="/admin/artists"
              className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-xs uppercase tracking-widest"
            >
              검색 / 목록
            </Link>
          </div>
        }
      />

      <AdminKpiRow
        items={[
          { label: "총 아티스트", value: artistCount ?? 0 },
          { label: "총 음원", value: trackCount ?? 0 },
          {
            label: "오늘 스트리밍",
            value: todayStreams,
            hint: `다운로드 ${todayDownloads.toLocaleString("ko-KR")}`,
          },
          { label: "상품 후기", value: reviewCount ?? 0 },
        ]}
      />

      <section className="mb-8 rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold">7일 스트리밍</h2>
          <span className="text-[10px] uppercase tracking-widest text-neutral-400">Streams</span>
        </div>
        <div className="flex h-40 items-end gap-2">
          {streamSeries.map(([day, count]) => (
            <div key={day} className="flex flex-1 flex-col items-center gap-2">
              <div
                className="w-full rounded-t bg-neutral-900/90"
                style={{ height: `${Math.max(4, (count / maxStream) * 100)}%` }}
                title={`${count.toLocaleString("ko-KR")}회`}
              />
              <span className="text-[10px] text-neutral-400">{day.slice(5)}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-neutral-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4">
          <h2 className="text-sm font-semibold">최근 아티스트</h2>
          <Link
            href="/admin/artists"
            className="text-[10px] uppercase tracking-widest text-neutral-500 underline"
          >
            전체 보기
          </Link>
        </div>
        {(recentArtists ?? []).length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-neutral-500">등록된 아티스트가 없습니다.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-100 text-[10px] uppercase tracking-widest text-neutral-400">
                  <th className="px-5 py-3 font-medium">아티스트</th>
                  <th className="px-5 py-3 font-medium">장르</th>
                  <th className="px-5 py-3 font-medium">등록일</th>
                  <th className="px-5 py-3 font-medium" />
                </tr>
              </thead>
              <tbody>
                {(recentArtists ?? []).map((artist) => (
                  <tr key={artist.id} className="border-b border-neutral-50 last:border-0">
                    <td className="px-5 py-3">
                      <p className="font-medium text-neutral-900">{artist.name}</p>
                      {artist.name_en ? (
                        <p className="mt-0.5 text-xs text-neutral-400">{artist.name_en}</p>
                      ) : null}
                    </td>
                    <td className="px-5 py-3 text-neutral-600">{artist.genre || "—"}</td>
                    <td className="px-5 py-3 text-neutral-500">
                      {artist.created_at
                        ? new Date(artist.created_at).toLocaleDateString("ko-KR")
                        : "—"}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link
                        href={`/admin/artists/${artist.id}/edit`}
                        className="text-[10px] uppercase tracking-widest text-neutral-500 underline"
                      >
                        수정
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
