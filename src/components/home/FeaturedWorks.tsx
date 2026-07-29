import Link from "next/link";
import { featuredWorks } from "@/data/home";
import { WorkCard } from "@/components/ui/WorkCard";

export function FeaturedWorks() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24">
      <div className="mb-10 flex items-end justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted">
            Featured
          </p>
          <h2 className="mt-1 text-xl font-medium uppercase tracking-wider md:text-2xl">
            추천 작품
          </h2>
        </div>
        <Link
          href="/works"
          className="text-xs uppercase tracking-widest text-muted transition-colors hover:text-foreground"
        >
          전체 보기 →
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-6">
        {featuredWorks.map((work) => (
          <WorkCard key={work.id} work={work} />
        ))}
      </div>
    </section>
  );
}
