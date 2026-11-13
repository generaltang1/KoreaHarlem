import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MagazineHomeClient } from "@/components/magazine/MagazineHomeClient";
import { MagazineShell } from "@/components/magazine/MagazineShell";
import { isCurrentUserAdmin } from "@/lib/auth/session";
import { collectTagCounts, type MagazineListItem } from "@/lib/magazine";
import { fetchPublishedMagazine } from "@/lib/magazineQueries";

export const dynamic = "force-dynamic";

export default async function MagazineMainPage() {
  const posts = await fetchPublishedMagazine(80);
  const isAdmin = await isCurrentUserAdmin();

  const cover = posts.find((p) => p.is_cover_story) ?? null;

  const featured =
    posts.find((p) => p.id !== cover?.id) ?? null;

  const mostRead = [...posts]
    .sort((a, b) => (b.view_count ?? 0) - (a.view_count ?? 0))
    .slice(0, 5);

  const featuredId = featured?.id;
  const latestGrid: MagazineListItem[] = posts.filter(
    (p) => p.id !== cover?.id && p.id !== featuredId,
  );

  const tags = collectTagCounts(posts);

  return (
    <>
      <Header />
      <MagazineShell>
        <MagazineHomeClient
          cover={cover}
          featured={featured}
          mostRead={mostRead}
          latest={latestGrid.length ? latestGrid : posts}
          tags={tags}
          isAdmin={isAdmin}
        />
      </MagazineShell>
      <Footer />
    </>
  );
}
