"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { navLinks } from "@/data/navigation";
import { DesktopNavMenu, MobileNavMenu } from "@/components/layout/NavMenu";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { useCart } from "@/context/CartContext";
import { CurrencySelector } from "@/components/commerce/CurrencySelector";
import { DjSetBar } from "@/components/player/DjSetBar";

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const { openCart, itemCount } = useCart();

  useEffect(() => {
    const auth = supabase.auth;

    const loadUser = async () => {
      const { data } = await auth.getUser();
      setUser(data.user);
      if (data.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .single();
        setIsAdmin(profile?.role === "admin");
      }
    };

    loadUser();

    const {
      data: { subscription },
    } = auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();
        setIsAdmin(profile?.role === "admin");
      } else {
        setIsAdmin(false);
      }
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const iconBtn =
    "flex h-10 w-10 items-center justify-center text-neutral-300 transition-colors hover:text-white";

  return (
    <div className="sticky top-0 z-50">
      <header className="select-none border-b border-neutral-800 bg-[#0a0a0c]/95 text-neutral-100 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-[1720px] items-center justify-between gap-4 px-4 sm:px-8 md:h-16">
          <div className="flex min-w-0 items-center gap-3 sm:gap-6">
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className={`${iconBtn} md:hidden`}
              aria-label="메뉴"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M2 5h16M2 10h16M2 15h16" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </button>

            <Link
              href="/"
              className="group flex shrink-0 items-center"
              aria-label="koreaharlem 홈"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo-wordmark.png"
                alt="koreaharlem"
                className="h-8 w-auto object-contain transition-opacity group-hover:opacity-90 sm:h-10 md:h-11"
              />
            </Link>

            <nav className="hidden items-center gap-6 md:flex lg:gap-8">
              <DesktopNavMenu items={navLinks} variant="dark" />
              {isAdmin && (
                <div className="group relative">
                  <button className="font-mono text-xs uppercase tracking-wider text-rose-400 transition-colors hover:text-rose-300">
                    Admin
                  </button>
                  <div className="invisible absolute left-0 top-full z-50 min-w-[160px] border border-neutral-800 bg-[#0a0a0c]/95 py-2 opacity-0 backdrop-blur-md transition-all group-hover:visible group-hover:opacity-100">
                    <Link
                      href="/admin"
                      className="block px-4 py-2 font-mono text-xs text-neutral-300 hover:bg-neutral-800/50 hover:text-white"
                    >
                      대시보드
                    </Link>
                    <Link
                      href="/admin/artists"
                      className="block px-4 py-2 font-mono text-xs text-neutral-300 hover:bg-neutral-800/50 hover:text-white"
                    >
                      아티스트 관리
                    </Link>
                    <Link
                      href="/admin/music"
                      className="block px-4 py-2 font-mono text-xs text-neutral-300 hover:bg-neutral-800/50 hover:text-white"
                    >
                      음악 관리
                    </Link>
                    <Link
                      href="/admin/dj-set"
                      className="block px-4 py-2 font-mono text-xs text-neutral-300 hover:bg-neutral-800/50 hover:text-white"
                    >
                      DJ SET 관리
                    </Link>
                    <Link
                      href="/admin/products"
                      className="block px-4 py-2 font-mono text-xs text-neutral-300 hover:bg-neutral-800/50 hover:text-white"
                    >
                      상품 관리
                    </Link>
                    <Link
                      href="/admin/orders"
                      className="block px-4 py-2 font-mono text-xs text-neutral-300 hover:bg-neutral-800/50 hover:text-white"
                    >
                      주문 관리
                    </Link>
                    <Link
                      href="/admin/tips"
                      className="block px-4 py-2 font-mono text-xs text-neutral-300 hover:bg-neutral-800/50 hover:text-white"
                    >
                      제보하기 관리
                    </Link>
                    <Link
                      href="/admin/think"
                      className="block px-4 py-2 font-mono text-xs text-neutral-300 hover:bg-neutral-800/50 hover:text-white"
                    >
                      THINK 관리
                    </Link>
                    <Link
                      href="/admin/events/new"
                      className="block px-4 py-2 font-mono text-xs text-neutral-300 hover:bg-neutral-800/50 hover:text-white"
                    >
                      이벤트 등록
                    </Link>
                  </div>
                </div>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-1 text-neutral-300">
            <Link
              href="/order-inquiry"
              className="hidden h-10 items-center px-2 font-mono text-[10px] uppercase tracking-wider transition-colors hover:text-white sm:flex"
            >
              주문조회
            </Link>
            <div className="hidden text-neutral-300 sm:block [&_select]:text-neutral-300 [&_select]:bg-[#0a0a0c]">
              <CurrencySelector />
            </div>
            <button
              type="button"
              onClick={() => setSearchOpen(!searchOpen)}
              className={iconBtn}
              aria-label="검색"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
                <path d="M13 13l3 3" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </button>
            <Link href="/mypage" className={iconBtn} aria-label="My Page">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.5" />
                <path d="M5 19c0-3.5 3-6 7-6s7 2.5 7 6" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </Link>
            <button type="button" onClick={openCart} className={`relative ${iconBtn}`} aria-label="장바구니">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M6 8h12l-1 12H7L6 8z" stroke="currentColor" strokeWidth="1.5" />
                <path d="M9 8V7a3 3 0 016 0v1" stroke="currentColor" strokeWidth="1.5" />
              </svg>
              {itemCount > 0 && (
                <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-white px-1 text-[9px] text-black">
                  {itemCount}
                </span>
              )}
            </button>
            {user ? (
              <button
                onClick={handleLogout}
                className="hidden h-10 items-center px-2 font-mono text-[10px] uppercase tracking-wider transition-colors hover:text-white sm:flex"
              >
                Logout
              </button>
            ) : (
              <Link
                href="/login"
                className="hidden h-10 items-center px-2 font-mono text-[10px] uppercase tracking-wider transition-colors hover:text-white sm:flex"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>

        {searchOpen && (
          <div className="border-t border-neutral-800 px-4 py-3 sm:px-8">
            <input
              type="search"
              placeholder="koreaharlem 전체검색"
              className="w-full bg-transparent font-mono text-sm text-neutral-200 outline-none placeholder:text-neutral-500"
              autoFocus
            />
          </div>
        )}

        {menuOpen && (
          <nav className="border-t border-neutral-800 px-4 py-4 md:hidden">
            <MobileNavMenu items={navLinks} onNavigate={() => setMenuOpen(false)} variant="dark" />
            <div className="mt-4 border-t border-neutral-800 pt-4">
              <Link
                href="/order-inquiry"
                onClick={() => setMenuOpen(false)}
                className="block py-3 text-sm uppercase tracking-widest text-neutral-200"
              >
                주문조회
              </Link>
              {isAdmin && (
                <Link
                  href="/admin"
                  onClick={() => setMenuOpen(false)}
                  className="block py-3 text-sm uppercase tracking-widest text-rose-400"
                >
                  Admin
                </Link>
              )}
              <Link
                href="/mypage"
                onClick={() => setMenuOpen(false)}
                className="block py-3 text-sm uppercase tracking-widest text-neutral-200"
              >
                My Page
              </Link>
              {user ? (
                <button
                  onClick={() => {
                    handleLogout();
                    setMenuOpen(false);
                  }}
                  className="block w-full py-3 text-left text-sm uppercase tracking-widest text-neutral-500"
                >
                  Logout
                </button>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="block py-3 text-sm uppercase tracking-widest text-neutral-200"
                >
                  Sign In
                </Link>
              )}
            </div>
          </nav>
        )}
      </header>
      <DjSetBar />
    </div>
  );
}
