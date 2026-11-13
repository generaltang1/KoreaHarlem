import { MagazineEditorClient } from "@/components/magazine/MagazineEditorClient";

export default function AdminMagazineNewPage() {
  return (
    <div className="-mx-4 rounded-[12px] bg-[#0a0a0a] px-4 py-6 md:-mx-6 md:px-6 md:py-8">
      <MagazineEditorClient mode="new" />
    </div>
  );
}
