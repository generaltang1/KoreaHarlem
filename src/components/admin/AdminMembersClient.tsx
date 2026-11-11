"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminKpiRow, AdminPageHeader } from "@/components/admin/AdminPageHeader";

type MemberRow = {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  providers: string[];
  role: string;
  is_blocked: boolean;
  blocked_reason: string | null;
};

type Kpi = { total: number; admins: number; blocked: number; pageSize: number };

export function AdminMembersClient() {
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [kpi, setKpi] = useState<Kpi>({ total: 0, admins: 0, blocked: 0, pageSize: 0 });
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async (query = q) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/members?q=${encodeURIComponent(query)}`);
      const json = (await res.json()) as { members?: MemberRow[]; kpi?: Kpi; message?: string };
      if (!res.ok) throw new Error(json.message || "불러오기 실패");
      setMembers(json.members ?? []);
      setKpi(json.kpi ?? { total: 0, admins: 0, blocked: 0, pageSize: 0 });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "오류");
    } finally {
      setLoading(false);
    }
  }, [q]);

  useEffect(() => {
    void load("");
  }, [load]);

  const patch = async (id: string, body: Record<string, unknown>) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/members/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = (await res.json()) as { message?: string };
      if (!res.ok) throw new Error(json.message || "변경 실패");
      await load(q);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "변경 실패");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <AdminPageHeader
        title="회원 관리"
        description="조회 · 권한(일반/관리자) · 차단"
        actions={
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              void load(q);
            }}
          >
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="이메일 · ID 검색"
              className="min-w-[220px] rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-xs uppercase tracking-widest"
            >
              검색
            </button>
          </form>
        }
      />

      <AdminKpiRow
        items={[
          { label: "전체 회원", value: kpi.total },
          { label: "관리자", value: kpi.admins },
          { label: "차단", value: kpi.blocked },
          { label: "이 페이지", value: kpi.pageSize },
        ]}
      />

      {error ? <p className="mb-4 text-sm text-rose-600">{error}</p> : null}
      {loading ? (
        <p className="text-sm text-neutral-500">불러오는 중…</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-[10px] uppercase tracking-widest text-neutral-500">
              <tr>
                <th className="px-4 py-3">이메일</th>
                <th className="px-4 py-3">권한</th>
                <th className="px-4 py-3">상태</th>
                <th className="px-4 py-3">가입</th>
                <th className="px-4 py-3">최근 로그인</th>
                <th className="px-4 py-3">관리</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id} className="border-b border-neutral-100">
                  <td className="px-4 py-3">
                    <p className="font-medium">{m.email || "(이메일 없음)"}</p>
                    <p className="font-mono text-[10px] text-neutral-400">{m.id.slice(0, 8)}…</p>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      className="rounded border border-neutral-300 px-2 py-1 text-xs"
                      value={m.role}
                      disabled={busyId === m.id}
                      onChange={(e) =>
                        void patch(m.id, { role: e.target.value as "user" | "admin" })
                      }
                    >
                      <option value="user">일반</option>
                      <option value="admin">관리자</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    {m.is_blocked ? (
                      <span className="rounded bg-rose-100 px-2 py-0.5 text-xs text-rose-700">
                        차단
                      </span>
                    ) : (
                      <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">
                        정상
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-neutral-500">
                    {new Date(m.created_at).toLocaleDateString("ko-KR")}
                  </td>
                  <td className="px-4 py-3 text-xs text-neutral-500">
                    {m.last_sign_in_at
                      ? new Date(m.last_sign_in_at).toLocaleString("ko-KR")
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {m.is_blocked ? (
                      <button
                        type="button"
                        disabled={busyId === m.id}
                        onClick={() => void patch(m.id, { is_blocked: false })}
                        className="text-xs underline"
                      >
                        차단 해제
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={busyId === m.id}
                        onClick={() => {
                          const reason = window.prompt("차단 사유 (선택)") ?? "";
                          void patch(m.id, { is_blocked: true, blocked_reason: reason });
                        }}
                        className="text-xs text-rose-600 underline"
                      >
                        차단
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {members.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-neutral-500">회원이 없습니다.</p>
          ) : null}
        </div>
      )}
    </div>
  );
}
