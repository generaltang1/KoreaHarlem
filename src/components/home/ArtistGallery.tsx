import Link from "next/link";
import { galleryWorks } from "@/data/home";

export function ArtistGallery() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24">
      <div className="mb-10 flex items-end justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted">
            Gallery
          </p>
          <h2 className="mt-1 text-xl font-medium uppercase tracking-wider md:text-2xl">
            Artist Fits
          </h2>
        </div>
        <Link
          href="/gallery"
          className="text-xs uppercase tracking-widest text-muted transition-colors hover:text-foreground"
        >
          전체 보기 →
        </Link>
      </div>

      <div className="columns-2 gap-2 sm:gap-3 md:columns-4 md:gap-4">
        {galleryWorks.map((work, i) => (
          <Link
            key={work.id}
            href={`/works/${work.id}`}
            className="group mb-3 block break-inside-avoid md:mb-4"
          >
            <div
              className={`relative overflow-hidden bg-gradient-to-br ${work.image} ${
                i % 3 === 0
                  ? "aspect-[3/4]"
                  : i % 3 === 1
                    ? "aspect-square"
                    : "aspect-[4/5]"
              }`}
            >
              <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 to-transparent p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <div>
                  <p className="text-xs font-medium text-white">{work.title}</p>
                  <p className="text-[10px] text-white/60">{work.artist}</p>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
