import { MagazineEditorClient } from "@/components/magazine/MagazineEditorClient";
import type { MagazineCategory } from "@/lib/magazine";

type SearchParams = Promise<{ category?: string }>;

export default async function AdminMagazineNewPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const defaultCategory: MagazineCategory =
    sp.category === "news" ? "news" : "culture";

  return (
    <div className="-mx-4 rounded-[12px] bg-[#0a0a0a] px-4 py-6 md:-mx-6 md:px-6 md:py-8">
      <MagazineEditorClient mode="new" defaultCategory={defaultCategory} />
    </div>
  );
}
