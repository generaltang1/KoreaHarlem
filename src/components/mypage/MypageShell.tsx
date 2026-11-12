"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CommerceAtmosphere } from "@/components/mypage/CommerceAtmosphere";
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
      <CommerceAtmosphere className="px-4 py-10 sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 lg:flex-row lg:gap-12">
          <aside className="w-full shrink-0 lg:w-[220px]">
            <p className="mb-3 text-[11px] font-medium text-[#fbc201]">마이페이지</p>
            <nav className="flex flex-col">
              {NAV.map((item) => {
                const active = isActive(
                  pathname,
                  item.href,
                  "exact" in item ? item.exact : false,
                );
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={active ? mp.navActive : mp.navIdle}
                  >
                    {item.label}
                  </Link>
                );
              })}
              <button
                type="button"
                onClick={handleLogout}
                className={`${mp.navIdle} mt-1 text-left text-[#6e6b65]`}
              >
                로그아웃
              </button>
            </nav>
          </aside>

          <div className="min-w-0 flex-1">
            {title ? (
              <div className="mb-6">
                <h1 className="text-[28px] font-bold tracking-tight text-[#f4f1ea]">{title}</h1>
                {subtitle ? <p className={`mt-1.5 text-sm ${mp.muted}`}>{subtitle}</p> : null}
              </div>
            ) : null}
            {children}
          </div>
        </div>
      </CommerceAtmosphere>
      <Footer />
    </>
  );
}
