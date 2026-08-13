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

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 md:h-16 md:px-6">
        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex h-10 w-10 items-center justify-center md:hidden"
          aria-label="메뉴"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M2 5h16M2 10h16M2 15h16" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </button>

        <nav className="hidden items-center gap-6 md:flex">
          <DesktopNavMenu items={navLinks} />
          {isAdmin && (
            <div className="group relative">
              <button className="text-xs uppercase tracking-widest text-rose-500 transition-opacity hover:opacity-60">
                Admin
              </button>
              <div className="invisible absolute left-0 top-full z-50 min-w-[160px] border border-border bg-background py-2 opacity-0 transition-all group-hover:visible group-hover:opacity-100">
                <Link href="/admin" className="block px-4 py-2 text-xs transition-colors hover:bg-foreground hover:text-background">
                  대시보드
                </Link>
                <Link href="/admin/artists" className="block px-4 py-2 text-xs transition-colors hover:bg-foreground hover:text-background">
                  아티스트 관리
                </Link>
                <Link href="/admin/music" className="block px-4 py-2 text-xs transition-colors hover:bg-foreground hover:text-background">
                  음악 관리
                </Link>
                <Link href="/admin/products" className="block px-4 py-2 text-xs transition-colors hover:bg-foreground hover:text-background">
                  상품 관리
                </Link>
                <Link href="/admin/orders" className="block px-4 py-2 text-xs transition-colors hover:bg-foreground hover:text-background">
                  주문 관리
                </Link>
                <Link href="/admin/events/new" className="block px-4 py-2 text-xs transition-colors hover:bg-foreground hover:text-background">
                  이벤트 등록
                </Link>
              </div>
            </div>
          )}
        </nav>

        <Link
          href="/"
          className="absolute left-1/2 flex -translate-x-1/2 items-center"
          aria-label="koreaharlem 홈"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-wordmark.png"
            alt="koreaharlem"
            className="h-4 w-auto object-contain invert md:h-5"
          />
        </Link>

        <div className="flex items-center gap-1">
          <Link
            href="/order-inquiry"
            className="hidden h-10 items-center px-2 text-[10px] uppercase tracking-widest transition-opacity hover:opacity-60 sm:flex"
          >
            주문조회
          </Link>
          <CurrencySelector />
          <button
            type="button"
            onClick={() => setSearchOpen(!searchOpen)}
            className="flex h-10 w-10 items-center justify-center transition-opacity hover:opacity-60"
            aria-label="검색"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
              <path d="M13 13l3 3" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </button>
          <Link
            href="/mypage"
            className="flex h-10 w-10 items-center justify-center transition-opacity hover:opacity-60"
            aria-label="My Page"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M5 19c0-3.5 3-6 7-6s7 2.5 7 6" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </Link>
          <button
            type="button"
            onClick={openCart}
            className="relative flex h-10 w-10 items-center justify-center transition-opacity hover:opacity-60"
            aria-label="장바구니"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M6 8h12l-1 12H7L6 8z" stroke="currentColor" strokeWidth="1.5" />
              <path d="M9 8V7a3 3 0 016 0v1" stroke="currentColor" strokeWidth="1.5" />
            </svg>
            {itemCount > 0 && (
              <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-foreground px-1 text-[9px] text-background">
                {itemCount}
              </span>
            )}
          </button>
          {user ? (
            <button
              onClick={handleLogout}
              className="hidden h-10 items-center px-2 text-[10px] uppercase tracking-widest transition-opacity hover:opacity-60 sm:flex"
            >
              Logout
            </button>
          ) : (
            <Link
              href="/login"
              className="hidden h-10 items-center px-2 text-[10px] uppercase tracking-widest transition-opacity hover:opacity-60 sm:flex"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>

      {searchOpen && (
        <div className="border-t border-border px-4 py-3 md:px-6">
          <input
            type="search"
            placeholder="작품, 아티스트 검색..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted"
            autoFocus
          />
        </div>
      )}

      {menuOpen && (
        <nav className="border-t border-border px-4 py-4 md:hidden">
          <MobileNavMenu items={navLinks} onNavigate={() => setMenuOpen(false)} />
          <div className="mt-4 border-t border-border pt-4">
            <Link
              href="/order-inquiry"
              onClick={() => setMenuOpen(false)}
              className="block py-3 text-sm uppercase tracking-widest"
            >
              주문조회
            </Link>
            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setMenuOpen(false)}
                className="block py-3 text-sm uppercase tracking-widest text-rose-500"
              >
                Admin
              </Link>
            )}
            <Link
              href="/mypage"
              onClick={() => setMenuOpen(false)}
              className="block py-3 text-sm uppercase tracking-widest"
            >
              My Page
            </Link>
            {user ? (
              <button
                onClick={() => {
                  handleLogout();
                  setMenuOpen(false);
                }}
                className="block w-full py-3 text-left text-sm uppercase tracking-widest text-muted"
              >
                Logout
              </button>
            ) : (
              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                className="block py-3 text-sm uppercase tracking-widest"
              >
                Sign In
              </Link>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
