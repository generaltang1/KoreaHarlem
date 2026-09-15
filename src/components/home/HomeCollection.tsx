import Image from "next/image";
import Link from "next/link";

export type HomeAlbumCard = {
  id: string;
  title: string;
  cover_url: string | null;
  artist: string;
};

type HomeCollectionProps = {
  albums: HomeAlbumCard[];
};

export function HomeCollection({ albums }: HomeCollectionProps) {
  return (
    <section
      id="collection-section"
      className="border-b border-neutral-800 bg-[#0a0a0c] px-4 py-12 text-neutral-100 sm:px-8 sm:py-16"
    >
      <div className="mx-auto max-w-[1720px]">
        <div className="mb-6 flex items-end justify-between gap-4">
          <h2 className="text-lg font-black uppercase tracking-tight sm:text-2xl">Collection</h2>
          <Link
            href="/artists"
            className="text-xs font-mono uppercase tracking-widest text-neutral-400 hover:text-white"
          >
            More →
          </Link>
        </div>
        {albums.length === 0 ? (
          <p className="text-sm text-neutral-500">등록된 앨범이 없습니다.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 sm:gap-6">
            {albums.map((album) => (
              <Link key={album.id} href={`/music/album/${album.id}`} className="group block">
                <div className="relative aspect-square overflow-hidden rounded-sm bg-neutral-950">
                  {album.cover_url ? (
                    <Image
                      src={album.cover_url}
                      alt={album.title}
                      fill
                      className="object-cover transition duration-500 group-hover:scale-105"
                      sizes="20vw"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-neutral-600">—</div>
                  )}
                </div>
                <p className="mt-2 truncate text-sm font-medium">{album.title}</p>
                <p className="truncate text-xs text-neutral-500">{album.artist}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
