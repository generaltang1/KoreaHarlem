import Link from "next/link";
import { magazinePublicPath } from "@/lib/magazine";
import { formatMagDate, type MagazineListItem } from "@/lib/magazineQueries";
import { mag } from "@/lib/magazineTheme";

export function MagazineCard({ post }: { post: MagazineListItem }) {
  const tags = (post.hashtags ?? []).slice(0, 3);
  return (
    <Link
      href={magazinePublicPath(post)}
      className={`group flex flex-col overflow-hidden ${mag.card} transition-colors hover:border-[rgba(251,194,1,0.35)]`}
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#151515]">
        {post.cover_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.cover_url}
            alt=""
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center px-4 text-center text-[11px] text-[#6e6b65]">
            이미지 자리 · 사용 허가 확인
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3.5">
        <div className={`flex items-center justify-between text-[10px] ${mag.tertiary}`}>
          <span>{formatMagDate(post.published_at)}</span>
          <span className="uppercase tracking-wider">
            {post.category === "news" ? "News" : "Culture"}
          </span>
        </div>
        <h3 className="line-clamp-2 text-[15px] font-bold leading-snug text-[#f4f1ea] group-hover:text-[#FBC201]">
          {post.title}
        </h3>
        {tags.length ? (
          <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
            {tags.map((t) => (
              <span
                key={t}
                className="rounded-[4px] border border-[rgba(244,241,234,0.12)] px-1.5 py-0.5 text-[10px] text-[#a8a49b]"
              >
                #{t}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </Link>
  );
}
