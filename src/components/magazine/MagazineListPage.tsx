import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { magazineCategoryLabel, type MagazineCategory } from "@/lib/magazine";
import { publishDueScheduledMagazine } from "@/lib/magazinePublish";

export async function MagazineListPage({ category }: { category: MagazineCategory }) {
  const service = createServiceClient();
  if (service) {
    await publishDueScheduledMagazine(service);
  }

  const supabase = await createClient();
  const { data: posts, error } = await supabase
    .from("magazine_posts")
    .select("id, title, excerpt, cover_url, published_at, category")
    .eq("category", category)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(40);

  const list = error ? [] : (posts ?? []);

  return (
    <>
      <Header />
      <main className="mx-auto min-h-[50vh] max-w-7xl px-4 py-16 pb-28 md:px-6">
        <p className="text-[10px] uppercase tracking-widest text-muted">
          Magazine · {magazineCategoryLabel(category)}
        </p>
        <h1 className="mt-1 text-2xl font-medium uppercase tracking-wider">
          {magazineCategoryLabel(category)}
        </h1>

        {list.length === 0 ? (
          <div className="mt-16 text-center">
            <p className="text-sm text-muted">아직 발행된 글이 없습니다.</p>
            <Link href="/" className="mt-8 inline-block text-xs uppercase tracking-widest underline">
              홈으로
            </Link>
          </div>
        ) : (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((post) => (
              <article
                key={post.id}
                className="overflow-hidden border border-border bg-background"
              >
                {post.cover_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={post.cover_url}
                    alt=""
                    className="aspect-[16/10] w-full object-cover"
                  />
                ) : (
                  <div className="aspect-[16/10] bg-neutral-100" />
                )}
                <div className="space-y-2 p-4">
                  <h2 className="text-sm font-semibold leading-snug">{post.title}</h2>
                  {post.excerpt ? (
                    <p className="line-clamp-3 text-xs text-muted">{post.excerpt}</p>
                  ) : null}
                  <p className="text-[10px] text-muted">
                    {post.published_at
                      ? new Date(post.published_at).toLocaleDateString("ko-KR")
                      : ""}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
