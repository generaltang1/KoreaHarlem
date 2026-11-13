import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MagazineBlockRenderer } from "@/components/magazine/MagazineBlockRenderer";
import { MagazineCard } from "@/components/magazine/MagazineCard";
import { MagazineShell } from "@/components/magazine/MagazineShell";
import { MagazineViewTracker } from "@/components/magazine/MagazineViewTracker";
import { isCurrentUserAdmin } from "@/lib/auth/session";
import { magazinePublicPath } from "@/lib/magazine";
import { parseBlocks, parseRelatedLinks } from "@/lib/magazineBlocks";
import { formatMagDate } from "@/lib/magazine";
import {
  fetchMagazineBySlugOrId,
  fetchPublishedMagazine,
} from "@/lib/magazineQueries";
import { mag } from "@/lib/magazineTheme";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ slug: string }> };

export default async function MagazineDetailPage({ params }: RouteContext) {
  const { slug } = await params;
  const post = await fetchMagazineBySlugOrId(slug);
  if (!post) notFound();

  const isAdmin = await isCurrentUserAdmin();
  const all = await fetchPublishedMagazine(80);
  const idx = all.findIndex((p) => p.id === post.id);
  const prev = idx >= 0 ? all[idx + 1] ?? null : null;
  const next = idx > 0 ? all[idx - 1] ?? null : null;
  const related = all.filter((p) => p.id !== post.id).slice(0, 4);

  const blocks = parseBlocks(post.content_blocks, post.content_html);
  const links = parseRelatedLinks(post.related_links);
  const tags = post.hashtags ?? [];
  const key = post.slug || post.id;

  return (
    <>
      <Header />
      <MagazineShell>
        <MagazineViewTracker slugOrId={key} />
        <div className="mx-auto max-w-[1280px] px-4 pb-24 pt-8 sm:px-8">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
            <p className={`text-[12px] ${mag.muted}`}>
              태그
              {tags.length ? ` / ${tags[0]}` : " / 떠돌이말"}
            </p>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/magazine"
                className="rounded-[8px] border border-[#FEE500] px-4 py-2 text-xs font-semibold text-[#FEE500]"
              >
                목록으로
              </Link>
              {isAdmin ? (
                <>
                  <Link
                    href={`/admin/magazine/${post.id}/edit`}
                    className="rounded-[8px] border border-[rgba(244,241,234,0.12)] px-4 py-2 text-xs text-[#a8a49b]"
                  >
                    수정
                  </Link>
                  <Link
                    href="/admin/magazine/new"
                    className={`${mag.yellowBtn} !rounded-[8px] !px-4 !py-2 !text-xs`}
                  >
                    새 글 쓰기
                  </Link>
                </>
              ) : null}
            </div>
          </div>

          <article className="mx-auto max-w-[760px]">
            <div className="mb-3 flex flex-wrap gap-2">
              {tags.slice(0, 4).map((t) => (
                <Link
                  key={t}
                  href={`/magazine/all?tag=${encodeURIComponent(t)}`}
                  className="rounded-[4px] border border-[rgba(244,241,234,0.12)] px-2 py-0.5 text-[11px] text-[#a8a49b] hover:border-[rgba(251,194,1,0.4)]"
                >
                  {t}
                </Link>
              ))}
              <span className={`text-[11px] ${mag.tertiary}`}>떠돌이말</span>
            </div>

            <h1 className="text-[28px] font-black leading-tight tracking-tight text-[#f4f1ea] sm:text-[36px]">
              {post.title}
            </h1>
            {post.excerpt ? (
              <p className={`mt-4 text-[15px] leading-relaxed ${mag.muted}`}>
                {post.excerpt}
              </p>
            ) : null}

            <div className={`mt-6 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] ${mag.tertiary}`}>
              {post.credit_text ? <span>WORDS: {post.credit_text}</span> : null}
              {post.credit_photo || post.cover_credit ? (
                <span>PHOTO: {post.credit_photo || post.cover_credit}</span>
              ) : null}
              <span>{formatMagDate(post.published_at)}</span>
            </div>

            {post.cover_url ? (
              <figure className="mt-10 overflow-hidden rounded-[8px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={post.cover_url}
                  alt=""
                  className="aspect-[16/10] w-full object-cover"
                />
                {post.cover_credit ? (
                  <figcaption className={`mt-2 text-[11px] ${mag.tertiary}`}>
                    {post.cover_credit}
                  </figcaption>
                ) : null}
              </figure>
            ) : null}

            <div className="mt-12">
              <MagazineBlockRenderer blocks={blocks} />
            </div>

            {links.length ? (
              <div className="mt-12 space-y-3">
                {links.map((link) => (
                  <a
                    key={link.url}
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between gap-4 rounded-[8px] border border-[rgba(244,241,234,0.12)] bg-[rgba(244,241,234,0.05)] px-4 py-4 transition-colors hover:border-[rgba(251,194,1,0.45)]"
                  >
                    <div>
                      <p className="text-[11px] font-semibold text-[#FEE500]">관련 링크</p>
                      <p className="mt-1 text-sm text-[#f4f1ea]">{link.label}</p>
                    </div>
                    <span className="shrink-0 text-sm text-[#FEE500]">바로가기 →</span>
                  </a>
                ))}
              </div>
            ) : null}

            <footer className={`mt-14 space-y-2 border-t border-[rgba(244,241,234,0.12)] pt-8 text-[13px] ${mag.muted}`}>
              {post.credit_text ? <p>글: {post.credit_text}</p> : null}
              {post.credit_photo ? <p>사진: {post.credit_photo}</p> : null}
              {post.credit_edit ? <p>편집: {post.credit_edit}</p> : null}
              {tags.length ? (
                <div className="flex flex-wrap gap-2 pt-2">
                  {tags.map((t) => (
                    <Link
                      key={t}
                      href={`/magazine/all?tag=${encodeURIComponent(t)}`}
                      className="text-[#FEE500] hover:underline"
                    >
                      #{t}
                    </Link>
                  ))}
                </div>
              ) : null}
            </footer>
          </article>

          <div className="mx-auto mt-16 max-w-[960px] border-t border-[rgba(244,241,234,0.12)] pt-8">
            <div className="flex flex-wrap items-start justify-between gap-6 text-sm">
              {prev ? (
                <Link
                  href={magazinePublicPath(prev)}
                  className={`max-w-[45%] ${mag.muted} hover:text-[#FEE500]`}
                >
                  ← {prev.title}
                </Link>
              ) : (
                <span />
              )}
              {next ? (
                <Link
                  href={magazinePublicPath(next)}
                  className={`max-w-[45%] text-right ${mag.muted} hover:text-[#FEE500]`}
                >
                  {next.title} →
                </Link>
              ) : null}
            </div>
          </div>

          <section className="mx-auto mt-16 max-w-[1280px]">
            <h2 className="mb-6 text-[18px] font-bold text-[#f4f1ea]">기사 더 보기</h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((p) => (
                <MagazineCard key={p.id} post={p} />
              ))}
            </div>
          </section>
        </div>
      </MagazineShell>
      <Footer />
    </>
  );
}
