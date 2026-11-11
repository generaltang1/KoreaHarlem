import Link from "next/link";
import { requireAdmin } from "@/lib/supabase/admin";

const NAV = [
  { href: "/admin/dashboard", label: "대시보드" },
  { href: "/admin/artists/dashboard", label: "아티스트 대시보드" },
  { href: "/admin/artists", label: "아티스트" },
  { href: "/admin/music", label: "음악" },

  { href: "/admin/dj-set", label: "DJ SET" },
  { href: "/admin/products", label: "상품" },
  { href: "/admin/orders", label: "주문" },
  { href: "/admin/orders/claims", label: "클레임" },
  { href: "/admin/tips", label: "제보" },
  { href: "/admin/think", label: "THINK" },
  { href: "/admin/magazine", label: "매거진" },
  { href: "/admin/members", label: "회원" },
  { href: "/admin/events/new", label: "이벤트" },
] as const;

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-900">
      <header className="border-b border-neutral-800 bg-[#0a0a0a] text-[#F4F1EA]">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3 md:px-6">
          <Link href="/admin/dashboard" className="text-xs font-black uppercase tracking-[0.2em]">
            KH Admin
          </Link>
          <nav className="flex flex-1 flex-wrap items-center gap-3">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-[10px] uppercase tracking-widest text-neutral-400 transition-colors hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <Link
            href="/"
            className="text-[10px] uppercase tracking-widest text-neutral-500 transition-colors hover:text-white"
          >
            ← 사이트
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-[1600px] px-4 py-8 md:px-6 md:py-10">{children}</main>
    </div>
  );
}
