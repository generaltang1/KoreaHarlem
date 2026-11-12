"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { createClient } from "@/lib/supabase/client";
import { mp } from "@/lib/mypageTheme";

const NAV = [
  { href: "/mypage", label: "마이페이지 홈", exact: true },
  { href: "/mypage/profile", label: "내 정보 변경" },
  { href: "/mypage/orders", label: "주문 내역" },
  { href: "/cart", label: "장바구니" },
  { href: "/mypage/wishlist", label: "위시리스트" },
  { href: "/mypage/music", label: "My Music" },
] as const;

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  if (href === "/mypage/orders") {
    return pathname === href || pathname.startsWith("/mypage/orders/");
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MypageShell({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <>
      <Header />
      <main className={`${mp.page} px-4 py-10 sm:px-8`}>
        <div className="mx-auto flex max-w-6xl flex-col gap-8 lg:flex-row lg:gap-10">
          <aside className="w-full shrink-0 lg:w-[220px]">
            <p className="mb-4 text-[10px] uppercase tracking-widest text-neutral-500">My Page</p>
            <nav className="flex flex-col gap-1">
              {NAV.map((item) => {
                const active = isActive(pathname, item.href, "exact" in item ? item.exact : false);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`py-2.5 text-sm transition-colors ${active ? mp.navActive : mp.navIdle}`}
                  >
                    {item.label}
                  </Link>
                );
              })}
              <button
                type="button"
                onClick={handleLogout}
                className={`mt-2 py-2.5 text-left text-sm ${mp.navIdle}`}
              >
                로그아웃
              </button>
            </nav>
          </aside>

          <div className="min-w-0 flex-1">
            {title ? (
              <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
                {subtitle ? <p className={`mt-1 text-sm ${mp.muted}`}>{subtitle}</p> : null}
              </div>
            ) : null}
            {children}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
