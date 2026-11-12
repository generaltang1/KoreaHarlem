"use client";

import { useMemo, useState } from "react";
import { ARTIST_GENRE_OTHER, genresForSelectBox } from "@/lib/artistGenres";

type Props = {
  value: string;
  onChange: (genre: string) => void;
  required?: boolean;
};

export function GenreSearchSelect({ value, onChange, required }: Props) {
  const [query, setQuery] = useState("");
  const options = useMemo(() => genresForSelectBox(query, 10), [query]);

  return (
    <div className="space-y-2">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="장르 검색"
        className="w-full rounded-md border border-[#333] px-3 py-2 text-sm"
      />
      <select
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        size={Math.min(11, Math.max(6, options.length))}
        className="w-full rounded-md border border-[#333] bg-[#151515] px-2 py-2 text-sm"
      >
        <option value="">대표 장르 선택</option>
        {options.map((g) => (
          <option key={g} value={g === "OTHER" ? ARTIST_GENRE_OTHER : g}>
            {g === "OTHER" ? ARTIST_GENRE_OTHER : g}
          </option>
        ))}
      </select>
      {value ? (
        <p className="text-xs text-[#6e6b65]">선택: {value}</p>
      ) : null}
    </div>
  );
}
