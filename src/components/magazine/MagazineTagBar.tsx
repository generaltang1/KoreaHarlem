"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { mag } from "@/lib/magazineTheme";

const FALLBACK_TAGS = [
  "음악",
  "힙합",
  "패션",
  "콜라보",
  "미술",
  "타투",
  "영화",
  "영상",
  "게임",
  "인터뷰",
  "아카이브",
];

export function MagazineTagBar({
  tags,
  active,
  basePath = "/magazine/all",
  showCounts = true,
  writeHref,
}: {
  tags: { tag: string; count: number }[];
  active?: string | null;
  basePath?: string;
  showCounts?: boolean;
  writeHref?: string | null;
}) {
  const [expanded, setExpanded] = useState(false);

  const merged = useMemo(() => {
    const map = new Map(tags.map((t) => [t.tag, t.count]));
    for (const t of FALLBACK_TAGS) {
      if (!map.has(t)) map.set(t, 0);
    }
    return [...map.entries()]
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => {
        const ai = FALLBACK_TAGS.indexOf(a.tag);
        const bi = FALLBACK_TAGS.indexOf(b.tag);
        if (ai >= 0 && bi >= 0) return ai - bi;
        if (ai >= 0) return -1;
        if (bi >= 0) return 1;
        return b.count - a.count;
      });
  }, [tags]);

  const visible = expanded ? merged : merged.slice(0, 11);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link
        href={basePath}
        className={!active ? mag.pillActive : mag.pill}
      >
        전체
      </Link>
      {visible.map(({ tag, count }) => {
        const isActive = (active ?? "").toLowerCase() === tag.toLowerCase();
        return (
          <Link
            key={tag}
            href={`${basePath}?tag=${encodeURIComponent(tag)}`}
            className={isActive ? mag.pillActive : mag.pill}
          >
            {tag}
            {showCounts && count > 0 ? ` ${count}` : ""}
          </Link>
        );
      })}
      {merged.length > 11 ? (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className={mag.pill}
        >
          {expanded ? "접기" : "+ 태그 더보기"}
        </button>
      ) : null}
      {writeHref ? (
        <Link
          href={writeHref}
          className={`ml-auto inline-flex items-center gap-2 ${mag.yellowBtn} !rounded-[2px] !px-4 !py-2.5 !text-[13px] !font-black`}
        >
          <span className="text-[10px] font-semibold opacity-80">관리자 전용</span>
          글쓰기
        </Link>
      ) : null}
    </div>
  );
}
