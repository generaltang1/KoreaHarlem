import Link from "next/link";
import { popularWorks } from "@/data/home";
import { WorkCard } from "@/components/ui/WorkCard";

export function PopularSection() {
  return (
    <section className="bg-foreground text-background">
      <div className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-background/50">
              Popular
            </p>
            <h2 className="mt-1 text-3xl font-light uppercase tracking-wider md:text-4xl">
              인기 작품
            </h2>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-background/60">
              커뮤니티가 가장 사랑하는 작품들을 만나보세요.
            </p>
            <Link
              href="/works?sort=popular"
              className="mt-8 inline-block border border-background/30 px-8 py-3 text-xs uppercase tracking-widest transition-all hover:bg-background hover:text-foreground"
            >
              Shop Now →
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {popularWorks.map((work) => (
              <div key={work.id} className="[&_h3]:text-background [&_p]:text-background/60 [&_span]:text-background">
                <WorkCard work={work} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
