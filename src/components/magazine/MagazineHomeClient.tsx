"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { MagazineCard } from "@/components/magazine/MagazineCard";
import { MagazineTagBar } from "@/components/magazine/MagazineTagBar";
import {
  formatMagDate,
  magazinePublicPath,
  type MagazineListItem,
} from "@/lib/magazine";
import { mag } from "@/lib/magazineTheme";

const INITIAL_LATEST = 8;

export function MagazineHomeClient({
  cover,
  featured,
  mostRead,
  latest,
  tags,
  isAdmin,
}: {
  cover: MagazineListItem | null;
  featured: MagazineListItem | null;
  mostRead: MagazineListItem[];
  latest: MagazineListItem[];
  tags: { tag: string; count: number }[];
  isAdmin: boolean;
}) {
  const [visible, setVisible] = useState(INITIAL_LATEST);
  const shown = useMemo(() => latest.slice(0, visible), [latest, visible]);

  return (
    <div className="mx-auto max-w-[1280px] px-4 pb-24 pt-0 sm:px-8">
      {cover ? (
        <Link
          href={magazinePublicPath(cover)}
          className="group relative mb-10 block min-h-[420px] overflow-hidden sm:min-h-[520px]"
        >
          {cover.cover_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cover.cover_url}
              alt=""
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
            />
          ) : (
            <div className="absolute inset-0 bg-[#151515]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/20" />
          <div className="relative flex h-full min-h-[420px] flex-col justify-end p-6 sm:min-h-[520px] sm:p-10">
            <p className={"text-[12px] " + mag.muted}>Kulture · 떠돌이말</p>
            {(cover.hashtags ?? []).length ? (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {(cover.hashtags ?? []).slice(0, 4).map((t) => (
                  <span
                    key={t}
                    className="rounded-[4px] bg-[rgba(10,10,10,0.55)] px-2 py-1 text-[11px] text-[#f4f1ea]"
                  >
                    {t}
                  </span>
                ))}
              </div>
            ) : null}
            <h1 className="mt-4 max-w-3xl text-[28px] font-black leading-tight tracking-tight text-[#f4f1ea] sm:text-[40px]">
              {cover.title}
            </h1>
            <p className={"mt-6 self-end text-[13px] group-hover:text-[#FEE500] " + mag.muted}>
              자세히 알아보기 →
            </p>
          </div>
        </Link>
      ) : (
        <div
          className={
            mag.card +
            " mb-10 flex min-h-[280px] items-center justify-center p-10 text-center"
          }
        >
          <div>
            <p className={"text-sm " + mag.muted}>
              커버스토리로 지정된 발행 글이 없습니다.
            </p>
            <p className={"mt-2 text-xs " + mag.tertiary}>
              Admin에서 「커버스토리」를 체크하면 이곳에 표시됩니다.
            </p>
          </div>
        </div>
      )}

      <div className="mb-10">
        <MagazineTagBar
          tags={tags}
          writeHref={isAdmin ? "/admin/magazine/new" : null}
        />
      </div>

      <div className="mb-14 grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        {featured ? (
          <Link
            href={magazinePublicPath(featured)}
            className={"group flex flex-col overflow-hidden " + mag.card}
          >
            <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#151515]">
              {featured.cover_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={featured.cover_url}
                  alt=""
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                />
              ) : null}
            </div>
            <div className="space-y-3 p-5">
              {(featured.hashtags ?? []).length ? (
                <div className="flex flex-wrap gap-1.5">
                  {(featured.hashtags ?? []).slice(0, 3).map((t) => (
                    <span
                      key={t}
                      className="rounded-[4px] border border-[rgba(244,241,234,0.12)] px-2 py-0.5 text-[10px] text-[#a8a49b]"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              ) : null}
              <h2 className="text-[22px] font-bold leading-snug text-[#f4f1ea] group-hover:text-[#FBC201]">
                {featured.title}
              </h2>
              {featured.excerpt ? (
                <p className={"line-clamp-2 text-sm " + mag.muted}>{featured.excerpt}</p>
              ) : null}
              {featured.cover_credit || featured.credit_photo ? (
                <p className={"text-[11px] " + mag.tertiary}>
                  PHOTO: {featured.cover_credit || featured.credit_photo}
                </p>
              ) : null}
            </div>
          </Link>
        ) : (
          <div
            className={
              mag.card +
              " flex min-h-[240px] items-center justify-center p-8 text-sm " +
              mag.muted
            }
          >
            피처 기사가 없습니다.
          </div>
        )}

        <aside className={mag.card + " p-5"}>
          <h2 className="mb-5 text-[15px] font-bold text-[#f4f1ea]">많이 본 기사</h2>
          {mostRead.length === 0 ? (
            <p className={"text-sm " + mag.muted}>집계된 기사가 없습니다.</p>
          ) : (
            <ol className="space-y-0">
              {mostRead.map((post, i) => (
                <li
                  key={post.id}
                  className="border-b border-[rgba(244,241,234,0.12)] last:border-0"
                >
                  <Link
                    href={magazinePublicPath(post)}
                    className="flex gap-3 py-4 transition-colors hover:bg-[rgba(244,241,234,0.03)]"
                  >
                    <span className="w-7 shrink-0 font-mono text-[13px] font-bold text-[#FEE500]">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0">
                      {(post.hashtags ?? []).length ? (
                        <div className="mb-1 flex flex-wrap gap-1">
                          {(post.hashtags ?? []).slice(0, 2).map((t) => (
                            <span key={t} className={"text-[10px] " + mag.tertiary}>
                              {t}
                            </span>
                          ))}
                        </div>
                      ) : null}
                      <p className="line-clamp-2 text-[14px] font-semibold leading-snug text-[#f4f1ea]">
                        {post.title}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </aside>
      </div>

      <div className="mb-6 flex items-end justify-between gap-4">
        <h2 className="text-[20px] font-bold text-[#f4f1ea]">최신 기사</h2>
        <Link
          href="/magazine/all"
          className={"text-[13px] hover:text-[#FEE500] " + mag.muted}
        >
          전체 보기 →
        </Link>
      </div>
      {shown.length === 0 ? (
        <p className={"py-16 text-center text-sm " + mag.muted}>
          아직 발행된 글이 없습니다.
        </p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {shown.map((post) => (
            <MagazineCard key={post.id} post={post} />
          ))}
        </div>
      )}
      {visible < latest.length ? (
        <div className="mt-10 flex justify-center">
          <button
            type="button"
            onClick={() => setVisible((v) => v + 8)}
            className="w-full max-w-md rounded-[8px] border border-[rgba(244,241,234,0.12)] bg-[rgba(244,241,234,0.05)] px-6 py-3.5 text-sm text-[#f4f1ea] transition-colors hover:border-[rgba(251,194,1,0.4)]"
          >
            기사 더 보기
          </button>
        </div>
      ) : null}
      {!cover && featured ? (
        <p className={"mt-6 text-center text-[11px] " + mag.tertiary}>
          {formatMagDate(featured.published_at)}
        </p>
      ) : null}
    </div>
  );
}
