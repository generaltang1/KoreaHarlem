"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { adminLight as admin } from "@/lib/siteTheme";

export type ArtistOption = { id: string; name: string };

/** E-08 — 아티스트 검색 · 다중 선택 */
export function ArtistMultiSelect({
  artists,
  selectedIds,
  onChange,
  loading,
}: {
  artists: ArtistOption[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  loading?: boolean;
}) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return artists.slice(0, 40);
    return artists.filter((a) => a.name.toLowerCase().includes(needle)).slice(0, 40);
  }, [artists, q]);

  const selected = artists.filter((a) => selectedIds.includes(a.id));

  const toggle = (id: string) => {
    if (selectedIds.includes(id)) onChange(selectedIds.filter((x) => x !== id));
    else onChange([...selectedIds, id]);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {selected.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => toggle(a.id)}
            className="inline-flex items-center gap-1 rounded-[6px] bg-[#0a0a0a] px-2.5 py-1 text-xs text-white"
          >
            {a.name} <span aria-hidden>×</span>
          </button>
        ))}
        {selected.length === 0 && (
          <span className={`text-xs ${admin.muted}`}>선택된 아티스트 없음</span>
        )}
      </div>
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="아티스트 검색…"
        className={admin.input}
        disabled={loading}
      />
      <div className={`${admin.card} max-h-48 overflow-y-auto`}>
        {filtered.length === 0 ? (
          <p className={`p-3 text-xs ${admin.muted}`}>
            결과 없음.{" "}
            <Link href="/admin/artists/new" className={admin.link}>
              아티스트 등록
            </Link>
          </p>
        ) : (
          <ul className="divide-y divide-[#e8e8e8]">
            {filtered.map((a) => {
              const on = selectedIds.includes(a.id);
              return (
                <li key={a.id}>
                  <button
                    type="button"
                    onClick={() => toggle(a.id)}
                    className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-[#f8f9fa] ${
                      on ? "bg-[#f3f0ff] font-medium" : ""
                    }`}
                  >
                    <span>{a.name}</span>
                    <span className="text-[10px] uppercase tracking-widest text-[#737373]">
                      {on ? "선택됨" : "선택"}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
