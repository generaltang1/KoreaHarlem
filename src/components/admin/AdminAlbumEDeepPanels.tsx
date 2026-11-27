"use client";

import { useCallback, useEffect, useState } from "react";
import { admin } from "@/lib/adminTheme";

type Supporter = {
  id: string;
  display_name: string;
  comment: string | null;
  is_public: boolean;
  created_at: string;
};

export function AdminAlbumEDeepPanels({ albumId }: { albumId: string }) {
  return (
    <div className="space-y-8 border-t border-border pt-8">
      <AdminAlbumSupportersPanel albumId={albumId} />
    </div>
  );
}

function AdminAlbumSupportersPanel({ albumId }: { albumId: string }) {
  const [supporters, setSupporters] = useState<Supporter[]>([]);
  const [name, setName] = useState("");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setMsg("");
    try {
      const res = await fetch(`/api/admin/music/albums/${albumId}/supporters`);
      const json = (await res.json()) as { supporters?: Supporter[]; message?: string };
      if (!res.ok) throw new Error(json.message || "불러오기 실패");
      setSupporters(json.supporters ?? []);
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : "불러오기 실패");
    } finally {
      setLoading(false);
    }
  }, [albumId]);

  useEffect(() => {
    void load();
  }, [load]);

  const add = async () => {
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch(`/api/admin/music/albums/${albumId}/supporters`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: name, comment, isPublic: true }),
      });
      const json = (await res.json()) as { supporter?: Supporter; message?: string };
      if (!res.ok || !json.supporter) throw new Error(json.message || "등록 실패");
      setSupporters((prev) => [json.supporter!, ...prev]);
      setName("");
      setComment("");
      setMsg("서포터 등록됨");
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : "등록 실패");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (supporterId: string) => {
    if (!confirm("이 서포터를 삭제할까요?")) return;
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch(`/api/admin/music/albums/${albumId}/supporters`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ supporterId }),
      });
      const json = (await res.json()) as { message?: string };
      if (!res.ok) throw new Error(json.message || "삭제 실패");
      setSupporters((prev) => prev.filter((s) => s.id !== supporterId));
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : "삭제 실패");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="space-y-3">
      <div>
        <p className={`text-[10px] uppercase tracking-widest ${admin.muted}`}>E-09 · Supported by</p>
        <p className={`mt-1 text-xs ${admin.muted}`}>
          공개 닉네임·한 줄 코멘트(200자). 구매 체크 연동은 추후 · 지금은 Admin 수동 등록.
        </p>
      </div>

      <div className="space-y-2 border border-border p-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value.slice(0, 40))}
          placeholder="닉네임 *"
          className={admin.input}
        />
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value.slice(0, 200))}
          placeholder="한 줄 코멘트 (선택 · 200자)"
          rows={2}
          className={`${admin.input} resize-y`}
        />
        <button
          type="button"
          disabled={busy || !name.trim()}
          onClick={() => void add()}
          className={admin.btnPrimary}
        >
          서포터 추가
        </button>
      </div>

      {loading ? (
        <p className={`text-xs ${admin.muted}`}>불러오는 중…</p>
      ) : supporters.length === 0 ? (
        <p className={`text-xs ${admin.muted}`}>등록된 서포터가 없습니다.</p>
      ) : (
        <ul className="divide-y divide-border border border-border">
          {supporters.map((s) => (
            <li key={s.id} className="flex items-start justify-between gap-3 px-3 py-2.5 text-sm">
              <div className="min-w-0">
                <p className="font-medium">
                  {s.display_name}
                  {!s.is_public ? (
                    <span className={`ml-2 text-[10px] ${admin.muted}`}>비공개</span>
                  ) : null}
                </p>
                {s.comment ? <p className={`mt-0.5 text-xs ${admin.muted}`}>{s.comment}</p> : null}
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={() => void remove(s.id)}
                className="shrink-0 text-[10px] uppercase tracking-widest text-rose-500"
              >
                삭제
              </button>
            </li>
          ))}
        </ul>
      )}
      {msg ? <p className={`text-xs ${admin.muted}`}>{msg}</p> : null}
    </section>
  );
}
