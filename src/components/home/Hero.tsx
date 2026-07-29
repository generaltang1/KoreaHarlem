import Link from "next/link";

export function Hero() {
  return (
    <section className="relative flex min-h-[70vh] items-center justify-center overflow-hidden md:min-h-[85vh]">
      <div className="absolute inset-0 bg-gradient-to-br from-stone-900 via-neutral-800 to-black" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />

      <div className="relative z-10 px-6 text-center text-white">
        <p className="mb-4 text-[10px] uppercase tracking-[0.4em] text-white/60 md:mb-6">
          종합 예술 플랫폼
        </p>
        <h1 className="text-3xl font-light uppercase tracking-[0.15em] sm:text-4xl md:text-6xl lg:text-7xl">
          KoreaHarlem
        </h1>
        <p className="mx-auto mt-4 max-w-xs text-sm leading-relaxed text-white/70 sm:max-w-md md:mt-6 md:text-base">
          You Are Art / Art Is You
        </p>
        <Link
          href="/works"
          className="mt-8 inline-block border border-white/40 px-6 py-3 text-xs uppercase tracking-widest transition-all hover:bg-white hover:text-black md:mt-10 md:px-8"
        >
          Explore Now →
        </Link>
      </div>
    </section>
  );
}
