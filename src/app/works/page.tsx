import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MusicTrackList } from "@/components/music/MusicTrackList";
import { mapDbTracksToPlayerTracks } from "@/lib/tracks";
import Image from "next/image";

const CATEGORY_LABELS: Record<string, string> = {
  music: "음악",
  visual: "시각 예술",
  performance: "공연",
  literature: "문학",
};

interface WorksPageProps {
  searchParams: Promise<{ category?: string }>;
}

export default async function WorksPage({ searchParams }: WorksPageProps) {
  const { category } = await searchParams;
  const supabase = await createClient();

  if (category === "music") {
    const { data: tracks } = await supabase
      .from("tracks")
      .select("*, artists(name)")
      .order("created_at", { ascending: false });

    const trackList = mapDbTracksToPlayerTracks(tracks ?? []);

    return (
      <>
        <Header />
        <main className="mx-auto max-w-7xl px-4 py-16 pb-28 md:px-6">
          <div className="mb-10">
            <p className="text-[10px] uppercase tracking-widest text-muted">Music</p>
            <h1 className="mt-1 text-2xl font-medium uppercase tracking-wider">음악</h1>
          </div>
          <MusicTrackList tracks={trackList} />
        </main>
        <Footer />
      </>
    );
  }

  let query = supabase
    .from("works")
    .select("*, artists(name)")
    .order("created_at", { ascending: false });

  if (category && category !== "music") {
    query = query.eq("category", category);
  }

  const { data: works } = await query;
  const pageTitle =
    category && CATEGORY_LABELS[category]
      ? CATEGORY_LABELS[category]
      : "전체 작품";

  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-16 pb-24 md:px-6">
        <div className="mb-10">
          <p className="text-[10px] uppercase tracking-widest text-muted">Works</p>
          <h1 className="mt-1 text-2xl font-medium uppercase tracking-wider">{pageTitle}</h1>
        </div>

        {!works || works.length === 0 ? (
          <div className="flex min-h-[40vh] items-center justify-center">
            <p className="text-sm text-muted">등록된 작품이 없습니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {works.map((work) => (
              <div key={work.id} className="group">
                <div className="relative aspect-[3/4] overflow-hidden bg-neutral-100">
                  {work.image_url ? (
                    <Image
                      src={work.image_url}
                      alt={work.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-neutral-200">
                      <span className="text-xs text-muted">
                        {CATEGORY_LABELS[work.category] ?? work.category}
                      </span>
                    </div>
                  )}
                </div>
                <div className="mt-3">
                  <p className="text-[10px] uppercase tracking-widest text-muted">
                    {CATEGORY_LABELS[work.category] ?? work.category}
                  </p>
                  <h3 className="mt-0.5 text-sm font-medium">{work.title}</h3>
                  {work.artists && (
                    <p className="text-xs text-muted">
                      {(work.artists as { name: string }).name}
                    </p>
                  )}
                  {work.price && (
                    <p className="mt-1 text-sm">₩{work.price.toLocaleString()}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
