import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import Image from "next/image";

export default async function ArtistsPage() {
  const supabase = await createClient();
  const { data: artists } = await supabase
    .from("artists")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-16 pb-24 md:px-6">
        <div className="mb-10">
          <p className="text-[10px] uppercase tracking-widest text-muted">Artists</p>
          <h1 className="mt-1 text-2xl font-medium uppercase tracking-wider">아티스트</h1>
        </div>

        {!artists || artists.length === 0 ? (
          <div className="flex min-h-[40vh] items-center justify-center">
            <p className="text-sm text-muted">등록된 아티스트가 없습니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
            {artists.map((artist) => (
              <div key={artist.id} className="group text-center">
                <div className="relative mx-auto aspect-square w-full max-w-[200px] overflow-hidden rounded-full bg-neutral-100">
                  {artist.image_url ? (
                    <Image
                      src={artist.image_url}
                      alt={artist.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-neutral-200">
                      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                        <circle cx="16" cy="12" r="6" stroke="currentColor" strokeWidth="1.5" />
                        <path d="M4 28c0-6.627 5.373-12 12-12s12 5.373 12 12" stroke="currentColor" strokeWidth="1.5" />
                      </svg>
                    </div>
                  )}
                </div>
                <h3 className="mt-3 text-sm font-medium">{artist.name}</h3>
                {artist.bio && (
                  <p className="mt-1 line-clamp-2 text-xs text-muted">{artist.bio}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
