import Link from "next/link";
import { collections } from "@/data/home";

export function Collections() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24">
      <div className="mb-10 text-center">
        <p className="text-[10px] uppercase tracking-widest text-muted">
          Collections
        </p>
        <h2 className="mt-1 text-xl font-medium uppercase tracking-wider md:text-2xl">
          카테고리
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        {collections.map((collection) => (
          <Link
            key={collection.id}
            href={collection.href}
            className="group relative aspect-[3/4] overflow-hidden"
          >
            <div
              className={`absolute inset-0 bg-gradient-to-b ${collection.image} transition-transform duration-500 group-hover:scale-105`}
            />
            <div className="absolute inset-0 flex flex-col items-center justify-end p-6 text-white">
              <p className="text-[10px] uppercase tracking-widest text-white/60">
                {collection.subtitle}
              </p>
              <p className="mt-1 text-lg font-medium">{collection.title}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
