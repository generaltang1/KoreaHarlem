import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MagazineCard } from "@/components/magazine/MagazineCard";
import { MagazineShell } from "@/components/magazine/MagazineShell";
import { MagazineTagBar } from "@/components/magazine/MagazineTagBar";
import { isCurrentUserAdmin } from "@/lib/auth/session";
import { collectTagCounts, filterByTag } from "@/lib/magazine";
import { fetchPublishedMagazine } from "@/lib/magazineQueries";
import { mag } from "@/lib/magazineTheme";

export const dynamic = "force-dynamic";

const PER_PAGE = 12;

type SearchParams = Promise<{ tag?: string; page?: string }>;

export default async function MagazineAllPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const tag = (sp.tag ?? "").trim() || null;
  const page = Math.max(1, Number(sp.page ?? "1") || 1);

  const all = await fetchPublishedMagazine(200);
  const tags = collectTagCounts(all);
  const filtered = filterByTag(all, tag);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const slice = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);
  const isAdmin = await isCurrentUserAdmin();

  const title = tag ?? "전체 기사";

  return (
    <>
      <Header />
      <MagazineShell>
        <div className="mx-auto max-w-[1280px] px-4 pb-24 pt-10 sm:px-8">
          <p className={`text-[12px] ${mag.muted}`}>떠돌이말 / 전체 기사</p>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-[32px] font-black tracking-tight text-[#f4f1ea] sm:text-[40px]">
                {title}{" "}
                <span className={`text-[18px] font-medium ${mag.muted}`}>
                  기사 {filtered.length}개
                </span>
              </h1>
            </div>
            {isAdmin ? (
              <Link
                href="/admin/magazine/new"
                className={`${mag.yellowBtn} !rounded-[2px] !px-4 !py-2.5 !text-[13px] !font-black`}
              >
                <span className="mr-2 text-[10px] opacity-80">관리자 전용</span>
                글쓰기
              </Link>
            ) : null}
          </div>

          <div className="mt-8">
            <MagazineTagBar tags={tags} active={tag} basePath="/magazine/all" />
          </div>

          {slice.length === 0 ? (
            <p className={`mt-20 text-center text-sm ${mag.muted}`}>
              해당 태그의 발행 글이 없습니다.
            </p>
          ) : (
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {slice.map((post) => (
                <MagazineCard key={post.id} post={post} />
              ))}
            </div>
          )}

          {totalPages > 1 ? (
            <nav className="mt-12 flex flex-wrap items-center justify-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => {
                const qs = new URLSearchParams();
                if (tag) qs.set("tag", tag);
                if (n > 1) qs.set("page", String(n));
                const href = `/magazine/all${qs.toString() ? `?${qs}` : ""}`;
                const active = n === safePage;
                return (
                  <Link
                    key={n}
                    href={href}
                    className={
                      active
                        ? "inline-flex h-9 w-9 items-center justify-center bg-[#f4f1ea] text-sm font-bold text-[#0a0a0a]"
                        : "inline-flex h-9 w-9 items-center justify-center border border-[rgba(244,241,234,0.12)] text-sm text-[#f4f1ea] hover:border-[rgba(251,194,1,0.4)]"
                    }
                  >
                    {n}
                  </Link>
                );
              })}
            </nav>
          ) : (
            <div className="mt-12 flex justify-center">
              <span className="inline-flex h-9 w-9 items-center justify-center bg-[#f4f1ea] text-sm font-bold text-[#0a0a0a]">
                1
              </span>
            </div>
          )}
        </div>
      </MagazineShell>
      <Footer />
    </>
  );
}
