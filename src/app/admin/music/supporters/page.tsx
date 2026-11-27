import Link from "next/link";
import { requireAdmin, createServiceClient } from "@/lib/supabase/admin";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { admin } from "@/lib/adminTheme";

export default async function AdminMusicSupportersPage() {
  await requireAdmin();
  const supabase = createServiceClient();

  let rows: {
    id: string;
    display_name: string;
    comment: string | null;
    is_public: boolean;
    created_at: string;
    album_id: string;
    albums: { title: string } | { title: string }[] | null;
  }[] = [];
  let loadError = "";

  if (supabase) {
    const { data, error } = await supabase
      .from("album_supporters")
      .select("id, display_name, comment, is_public, created_at, album_id, albums(title)")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) {
      loadError = error.message.includes("album_supporters")
        ? "supabase/add_music_e_deep.sql 을 실행해 주세요."
        : error.message;
    } else {
      rows = (data ?? []) as typeof rows;
    }
  } else {
    loadError = "SUPABASE_SERVICE_ROLE_KEY가 필요합니다.";
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Supported by"
        description="E-09 · 앨범별 공개 닉네임·코멘트. 개별 등록·삭제는 앨범 수정 화면에서."
      />

      <div className="flex flex-wrap gap-2">
        <Link href="/admin/music" className={admin.btnGhost}>
          ← 음악 관리
        </Link>
      </div>

      {loadError ? (
        <p className="text-sm text-rose-500">{loadError}</p>
      ) : rows.length === 0 ? (
        <p className={`text-sm ${admin.muted}`}>등록된 서포터가 없습니다.</p>
      ) : (
        <div className="overflow-x-auto border border-border">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className={`border-b border-border text-[10px] uppercase tracking-widest ${admin.muted}`}>
              <tr>
                <th className="px-3 py-2.5">앨범</th>
                <th className="px-3 py-2.5">닉네임</th>
                <th className="px-3 py-2.5">코멘트</th>
                <th className="px-3 py-2.5">공개</th>
                <th className="px-3 py-2.5">등록</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((row) => {
                const albumTitle = Array.isArray(row.albums)
                  ? row.albums[0]?.title
                  : row.albums?.title;
                return (
                  <tr key={row.id}>
                    <td className="px-3 py-2.5">
                      <Link
                        href={`/admin/music/${row.album_id}/edit`}
                        className="font-medium hover:underline"
                      >
                        {albumTitle || row.album_id.slice(0, 8)}
                      </Link>
                    </td>
                    <td className="px-3 py-2.5">{row.display_name}</td>
                    <td className={`max-w-xs truncate px-3 py-2.5 ${admin.muted}`}>
                      {row.comment || "—"}
                    </td>
                    <td className="px-3 py-2.5">{row.is_public ? "Y" : "N"}</td>
                    <td className={`px-3 py-2.5 tabular-nums ${admin.muted}`}>
                      {new Date(row.created_at).toLocaleDateString("ko-KR")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
