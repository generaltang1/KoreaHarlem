"use client";

import { useEffect, useState } from "react";
import type { ThinkYoutubeInput } from "@/lib/think";

type YouTubeSearchModalProps = {
  onClose: () => void;
  onSelect: (video: ThinkYoutubeInput) => void;
};

type SearchItem = {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
  publishedAt: string;
};

export function YouTubeSearchModal({ onClose, onSelect }: YouTubeSearchModalProps) {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<SearchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const search = async () => {
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/think/youtube/search?q=${encodeURIComponent(q)}`);
      const json = (await res.json()) as { items?: SearchItem[]; message?: string };
      if (!res.ok) throw new Error(json.message || "검색에 실패했습니다.");
      setItems(json.items ?? []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "검색에 실패했습니다.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={onClose}>
      <div
        className="flex max-h-[85vh] w-full max-w-lg flex-col bg-background"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-foreground px-4 py-3 text-sm font-medium text-background">유튜브 등록하기</div>

        <div className="flex gap-2 border-b border-border p-4">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void search();
            }}
            placeholder="검색어를 입력하세요"
            className="min-w-0 flex-1 border border-border px-3 py-2 text-sm outline-none focus:border-foreground"
          />
          <button
            type="button"
            onClick={() => void search()}
            disabled={loading}
            className="shrink-0 border border-border px-4 py-2 text-xs disabled:opacity-50"
          >
            검색
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {loading && <p className="p-4 text-center text-xs text-muted">검색 중…</p>}
          {error && <p className="p-4 text-center text-xs text-red-600">{error}</p>}
          {!loading && !error && items.length === 0 && (
            <p className="p-4 text-center text-xs text-muted">검색 결과가 없습니다.</p>
          )}
          <ul className="divide-y divide-border">
            {items.map((item) => (
              <li key={item.videoId}>
                <button
                  type="button"
                  onClick={() =>
                    onSelect({
                      videoId: item.videoId,
                      title: item.title,
                      channelTitle: item.channelTitle,
                      thumbnailUrl: item.thumbnailUrl,
                    })
                  }
                  className="flex w-full gap-3 p-3 text-left hover:bg-neutral-50"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.thumbnailUrl} alt="" className="h-14 w-24 shrink-0 object-cover" />
                  <div className="min-w-0">
                    <p className="line-clamp-2 text-sm text-blue-700">{item.title}</p>
                    <p className="mt-1 truncate text-xs text-muted">{item.channelTitle}</p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="border-t border-border p-4 text-center">
          <button type="button" onClick={onClose} className="bg-neutral-600 px-8 py-2 text-xs text-white">
            취소
          </button>
        </div>
      </div>
    </div>
  );
}
