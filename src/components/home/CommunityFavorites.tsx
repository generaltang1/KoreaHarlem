import Link from "next/link";

export function CommunityFavorites() {
  return (
    <section className="relative flex min-h-[50vh] items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-violet-950 via-purple-900 to-indigo-950" />
      <div className="absolute inset-0 bg-black/30" />

      <div className="relative z-10 px-6 text-center text-white">
        <p className="text-[10px] uppercase tracking-[0.4em] text-white/50">
          Community
        </p>
        <h2 className="mt-4 text-3xl font-light uppercase tracking-wider md:text-5xl">
          Community Favorites
        </h2>
        <p className="mx-auto mt-4 max-w-md text-sm text-white/60">
          아티스트와 관객이 함께 만드는 문화
        </p>
        <Link
          href="/community"
          className="mt-8 inline-block bg-white px-10 py-3 text-xs uppercase tracking-widest text-black transition-opacity hover:opacity-80"
        >
          Explore →
        </Link>
      </div>
    </section>
  );
}
