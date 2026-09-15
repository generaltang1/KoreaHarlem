import Link from "next/link";

export function HomeMagazine() {
  return (
    <section
      id="magazine-section"
      className="border-b border-neutral-800 bg-[#0a0a0c] px-4 py-16 text-neutral-100 sm:px-8 sm:py-24"
    >
      <div className="mx-auto max-w-[1720px]">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">
              Editorial Archive
            </p>
            <h2 className="mt-1 text-3xl font-black uppercase tracking-tight sm:text-5xl">
              Magazine
            </h2>
            <p className="mt-2 max-w-xl text-sm text-neutral-400">
              문화와 현상을 기록하는 매거진. 곧 공개됩니다.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-mono">
            <span className="rounded-sm bg-white px-3 py-1.5 font-bold text-black">ALL</span>
            <span className="rounded-sm border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-neutral-400">
              Music
            </span>
            <span className="rounded-sm border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-neutral-400">
              Art
            </span>
            <span className="rounded-sm border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-neutral-400">
              Movie
            </span>
          </div>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="flex min-h-[280px] flex-col justify-between border border-neutral-800 bg-neutral-950 p-5"
            >
              <span className="w-fit bg-[#a3ff12] px-2 py-0.5 text-[10px] font-bold uppercase text-black">
                Coming Soon
              </span>
              <div>
                <h3 className="text-lg font-bold leading-snug">Magazine Issue {i}</h3>
                <p className="mt-2 text-xs text-neutral-500">준비 중</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8 text-right">
          <Link
            href="/magazine/culture"
            className="text-xs font-mono uppercase tracking-widest text-neutral-400 hover:text-white"
          >
            View More →
          </Link>
        </div>
      </div>
    </section>
  );
}
