import { notFound } from "next/navigation";
import { MagazineEditorClient } from "@/components/magazine/MagazineEditorClient";
import { fetchMagazineAdminById } from "@/lib/magazineQueries";

type RouteContext = { params: Promise<{ id: string }> };

export default async function AdminMagazineEditPage({ params }: RouteContext) {
  const { id } = await params;
  const post = await fetchMagazineAdminById(id);
  if (!post) notFound();
  return (
    <div className="-mx-4 rounded-[12px] bg-[#0a0a0a] px-4 py-6 md:-mx-6 md:px-6 md:py-8">
      <MagazineEditorClient mode="edit" initial={post} />
    </div>
  );
}
