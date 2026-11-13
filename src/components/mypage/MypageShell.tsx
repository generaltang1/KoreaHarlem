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
  variant = "default",
  headRight,
}: {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  /** "music": E-07 Figma 레이아웃 (브레드크럼 · 24px 사이드 타이틀 · 디스플레이 헤드) */
  variant?: "default" | "music";
  /** variant="music" 헤드 우측 (정렬 등) */
  headRight?: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const isMusic = variant === "music";

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
        <div className={`mx-auto flex flex-col gap-8 ${isMusic ? "max-w-[1168px]" : "max-w-6xl"}`}>
          {isMusic ? (
            <nav
              aria-label="breadcrumb"
              className="flex items-start gap-2.5 text-[11px] font-medium"
            >
              <Link href="/mypage" className="text-[#a8a49b] transition hover:text-[#f4f1ea]">
                마이페이지
              </Link>
              <span className="font-mono text-[#6e6b65]">/</span>
              <span className="font-mono tracking-[1.5px] text-[#f4f1ea]">My Music</span>
            </nav>
          ) : null}
          <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
            <aside className="w-full shrink-0 lg:w-[220px]">
              {isMusic ? (
                <p className="mb-4 text-[24px] font-normal leading-normal text-[#f4f1ea]">
                  마이페이지
                </p>
              ) : (
                <p className="mb-3 text-[11px] font-medium text-[#fbc201]">마이페이지</p>
              )}
              <nav className="flex flex-col gap-[2px]">
                {NAV.map((item) => {
                  const active = isActive(
                    pathname,
                    item.href,
                    "exact" in item ? item.exact : false,
                  );
                  const musicItem = isMusic && item.href === "/mypage/music";
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={
                        isMusic
                          ? active
                            ? `border-l-2 border-[#fbc201] py-3 pl-3 text-[14px] font-bold text-[#f4f1ea] ${
                                musicItem
                                  ? "tracking-[1px] [font-family:var(--font-f-display),var(--font-f-sans),sans-serif]"
                                  : ""
                              }`
                            : "border-l-2 border-transparent py-3 text-[14px] font-medium text-[#a8a49b] transition-colors hover:text-[#f4f1ea]"
                          : active
                            ? mp.navActive
                            : mp.navIdle
                      }
                    >
                      {item.label}
                    </Link>
                  );
                })}
                <button
                  type="button"
                  onClick={handleLogout}
                  className={
                    isMusic
                      ? "border-l-2 border-transparent py-3 text-left text-[14px] font-medium text-[#6e6b65] transition-colors hover:text-[#f4f1ea]"
                      : `${mp.navIdle} mt-1 text-left text-[#6e6b65]`
                  }
                >
                  로그아웃
                </button>
              </nav>
            </aside>

            <div className="min-w-0 flex-1">
              {title && isMusic ? (
                <div className="mb-5 flex flex-wrap items-baseline gap-x-3.5 gap-y-1 border-b-2 border-[#f4f1ea] pb-3.5">
                  <h1 className="text-[28px] font-bold leading-normal text-[#f4f1ea] [font-family:var(--font-f-display),var(--font-f-sans),sans-serif] sm:text-[36px]">
                    {title}
                  </h1>
                  {subtitle ? (
                    <p className="text-[14px] font-medium text-[#a8a49b]">{subtitle}</p>
                  ) : null}
                  <div className="h-px min-w-px flex-1" />
                  {headRight}
                </div>
              ) : title ? (
                <div className="mb-6">
                  <h1 className="text-[28px] font-bold tracking-tight text-[#f4f1ea]">{title}</h1>
                  {subtitle ? <p className={`mt-1.5 text-sm ${mp.muted}`}>{subtitle}</p> : null}
                </div>
              ) : null}
              {children}
            </div>
          </div>
        </div>
      </CommerceAtmosphere>
      <Footer />
    </>
  );
}
