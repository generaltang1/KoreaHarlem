import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MagazineCard } from "@/components/magazine/MagazineCard";
import { MagazineShell } from "@/components/magazine/MagazineShell";
import { isCurrentUserAdmin } from "@/lib/auth/session";
import {
  magazineCategoryLabel,
  type MagazineCategory,
} from "@/lib/magazine";
import {
  fetchPublishedMagazine,
  type MagazineListItem,
} from "@/lib/magazineQueries";
import { mag } from "@/lib/magazineTheme";

export async function MagazineListPage({ category }: { category: MagazineCategory }) {
  const all = await fetchPublishedMagazine(80);
  const list = all.filter((p) => p.category === category) as MagazineListItem[];
  const isAdmin = await isCurrentUserAdmin();
  const label = magazineCategoryLabel(category);

  return (
    <>
      <Header />
      <MagazineShell>
        <div className="mx-auto max-w-[1280px] px-4 pb-24 pt-10 sm:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className={"text-[12px] " + mag.muted}>떠돌이말 / {label}</p>
              <h1 className="mt-2 text-[32px] font-black tracking-tight text-[#f4f1ea] sm:text-[40px]">
                {label}{" "}
                <span className={"text-[18px] font-medium " + mag.muted}>
                  기사 {list.length}개
                </span>
              </h1>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/magazine"
                className="rounded-[8px] border border-[rgba(244,241,234,0.12)] px-4 py-2.5 text-xs text-[#a8a49b]"
              >
                메인
              </Link>
              <Link
                href="/magazine/all"
                className="rounded-[8px] border border-[rgba(244,241,234,0.12)] px-4 py-2.5 text-xs text-[#a8a49b]"
              >
                전체 기사
              </Link>
              {isAdmin ? (
                <Link
                  href={`/admin/magazine/new?category=${category}`}
                  className={
                    mag.yellowBtn +
                    " !rounded-[2px] !px-4 !py-2.5 !text-[13px] !font-black"
                  }
                >
                  <span className="mr-2 text-[10px] opacity-80">관리자 전용</span>
                  글쓰기
                </Link>
              ) : null}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <Link
              href="/magazine/culture"
              className={
                category === "culture" ? mag.pillActive : mag.pill
              }
            >
              Culture
            </Link>
            <Link
              href="/magazine/news"
              className={category === "news" ? mag.pillActive : mag.pill}
            >
              News
            </Link>
          </div>

          {list.length === 0 ? (
            <p className={"mt-20 text-center text-sm " + mag.muted}>
              아직 발행된 {label} 글이 없습니다.
            </p>
          ) : (
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {list.map((post) => (
                <MagazineCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>
      </MagazineShell>
      <Footer />
    </>
  );
}
