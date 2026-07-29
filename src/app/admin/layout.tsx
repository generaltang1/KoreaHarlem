import Link from "next/link";
import { requireAdmin } from "@/lib/supabase/admin";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-foreground text-background">
        <div className="mx-auto flex h-12 max-w-7xl items-center gap-6 px-4 md:px-6">
          <span className="text-[10px] font-semibold uppercase tracking-widest">
            Admin
          </span>
          <nav className="flex items-center gap-4">
            <Link href="/admin" className="text-[10px] uppercase tracking-widest text-background/60 transition-colors hover:text-background">
              대시보드
            </Link>
            <Link href="/admin/music" className="text-[10px] uppercase tracking-widest text-background/60 transition-colors hover:text-background">
              음악 관리
            </Link>
            <Link href="/admin/works/new" className="text-[10px] uppercase tracking-widest text-background/60 transition-colors hover:text-background">
              상품 등록
            </Link>
            <Link href="/admin/artists/new" className="text-[10px] uppercase tracking-widest text-background/60 transition-colors hover:text-background">
              아티스트 등록
            </Link>
            <Link href="/admin/events/new" className="text-[10px] uppercase tracking-widest text-background/60 transition-colors hover:text-background">
              이벤트 등록
            </Link>
          </nav>
          <div className="ml-auto">
            <Link href="/" className="text-[10px] uppercase tracking-widest text-background/60 transition-colors hover:text-background">
              ← 사이트로
            </Link>
          </div>
        </div>
      </div>
      <main className="mx-auto max-w-3xl px-4 py-12 md:px-6">
        {children}
      </main>
    </div>
  );
}
