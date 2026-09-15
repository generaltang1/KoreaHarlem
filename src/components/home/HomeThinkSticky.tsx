import Link from "next/link";
import type { ThinkPostListItem } from "@/lib/think";
import { formatThinkDate } from "@/lib/think";

const STICKY_COLORS = [
  { bg: "bg-[#d9ff38]", border: "border-[#c2ea24]", text: "text-neutral-950", muted: "text-neutral-800" },
  { bg: "bg-[#fef08a]", border: "border-[#fde047]", text: "text-neutral-900", muted: "text-neutral-700" },
  { bg: "bg-[#a5f3fc]", border: "border-[#67e8f9]", text: "text-neutral-950", muted: "text-neutral-800" },
  { bg: "bg-[#fecdd3]", border: "border-[#fda4af]", text: "text-neutral-950", muted: "text-neutral-800" },
  { bg: "bg-[#1a1e22]", border: "border-[#2d343c]", text: "text-neutral-100", muted: "text-neutral-400" },
] as const;

const ROTATIONS = ["-rotate-1", "rotate-1", "-rotate-2", "rotate-2", ""] as const;

function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function hashColor(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h + id.charCodeAt(i) * (i + 1)) % 997;
  return h;
}

type HomeThinkStickyProps = {
  posts: ThinkPostListItem[];
  totalCount: number;
};

export function HomeThinkSticky({ posts, totalCount }: HomeThinkStickyProps) {
  return (
    <section
      id="think-section"
      className="border-b border-neutral-800 bg-[#0a0a0c] px-4 py-16 text-neutral-100 sm:px-8 sm:py-24"
    >
      <div className="mx-auto max-w-[1720px]">
        <div className="mb-10 flex flex-col justify-between gap-6 border-b border-neutral-800 pb-8 md:flex-row md:items-end">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 border border-neutral-800 bg-neutral-900 px-2.5 py-1 text-xs font-mono uppercase tracking-widest text-neutral-400">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#d4ff32]" />
              Anonymous Sub-Culture Bulletin
            </div>
            <h2 className="text-3xl font-black uppercase tracking-tight sm:text-5xl">Think</h2>
            <p className="max-w-2xl text-sm leading-relaxed text-neutral-400">
              거리의 날것 같은 생각들. 포스트잇처럼 붙인 담론 아카이브.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="border border-neutral-800 bg-neutral-900/80 px-5 py-3 font-mono text-xs">
              <div className="text-[10px] uppercase text-neutral-500">Total</div>
              <div className="text-xl font-bold text-white">{totalCount}</div>
            </div>
            <Link
              href="/think"
              className="text-xs font-mono uppercase tracking-widest text-neutral-400 hover:text-white"
            >
              More →
            </Link>
            <Link
              href="/think/new"
              className="inline-flex items-center gap-2 border border-[#d4ff32] bg-[#d4ff32] px-5 py-3 text-xs font-bold font-mono text-black transition hover:bg-[#e2ff5e]"
            >
              + 글쓰기
            </Link>
          </div>
        </div>

        {posts.length === 0 ? (
          <p className="py-12 text-center text-sm text-neutral-500">아직 게시글이 없습니다.</p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {posts.map((post) => {
              const h = hashColor(post.id);
              const color = STICKY_COLORS[h % STICKY_COLORS.length];
              const rotate = ROTATIONS[h % ROTATIONS.length];
              const excerpt = stripHtml(post.content_html).slice(0, 140);
              return (
                <Link
                  key={post.id}
                  href={`/think/${post.id}`}
                  className={`relative flex min-h-[240px] flex-col justify-between border p-6 shadow-2xl transition hover:z-10 hover:scale-105 hover:rotate-0 ${color.bg} ${color.border} ${color.text} ${rotate}`}
                >
                  <div>
                    <div className={`mb-3 flex items-center justify-between border-b pb-2 ${post.is_notice || color.bg.includes("1a1e22") ? "border-neutral-800" : "border-black/10"}`}>
                      <span className="max-w-[150px] truncate font-mono text-xs font-extrabold uppercase">
                        {post.author_display}
                      </span>
                      <span className={`font-mono text-[10px] ${color.muted}`}>
                        {formatThinkDate(post.created_at)}
                      </span>
                    </div>
                    <h3 className="mb-2 line-clamp-2 text-sm font-bold leading-snug">{post.title}</h3>
                    <p className="line-clamp-4 text-sm leading-relaxed">{excerpt || "…"}</p>
                  </div>
                  <div
                    className={`mt-4 flex items-center justify-between border-t pt-3 font-mono text-xs ${
                      color.bg.includes("1a1e22") ? "border-neutral-800" : "border-black/10"
                    }`}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <span className="text-red-500">♥</span>
                      <span className="font-bold">{post.recommend_count}</span>
                    </span>
                    <span className={`inline-flex items-center gap-1 ${color.muted}`}>
                      <span aria-hidden>💬</span>
                      {post.comment_count ?? 0}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        <div className="mt-10 text-right">
          <Link
            href="/think"
            className="text-xs font-mono uppercase tracking-widest text-neutral-400 hover:text-white"
          >
            More →
          </Link>
        </div>
      </div>
    </section>
  );
}
