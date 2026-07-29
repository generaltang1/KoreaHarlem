"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { navLinks } from "@/data/home";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const auth = supabase.auth;
    auth.getUser().then(({ data }) => setUser(data.user));
    const { data: { subscription } } = auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
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
        {/* Mobile menu */}
        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex h-10 w-10 items-center justify-center md:hidden"
          aria-label="메뉴"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M2 5h16M2 10h16M2 15h16"
              stroke="currentColor"
              strokeWidth="1.5"
            />
          </svg>
        </button>

        {/* Desktop nav left */}
        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) =>
            link.children ? (
              <div key={link.label} className="group relative">
                <button className="text-xs uppercase tracking-widest transition-opacity hover:opacity-60">
                  {link.label}
                </button>
                <div className="invisible absolute left-0 top-full z-50 min-w-[160px] border border-border bg-background py-2 opacity-0 transition-all group-hover:visible group-hover:opacity-100">
                  {link.children.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      className="block px-4 py-2 text-xs transition-colors hover:bg-foreground hover:text-background"
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <Link
                key={link.href}
                href={link.href!}
                className="text-xs uppercase tracking-widest transition-opacity hover:opacity-60"
              >
                {link.label}
              </Link>
            )
          )}
        </nav>

        {/* Logo */}
        <Link
          href="/"
          className="absolute left-1/2 -translate-x-1/2 text-sm font-semibold uppercase tracking-[0.25em] md:text-base"
        >
          KoreaHarlem
        </Link>

        {/* Right actions */}
        <div className="flex items-center gap-1">
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
          {user ? (
            <button
              onClick={handleLogout}
              className="hidden h-10 items-center px-3 text-xs uppercase tracking-widest transition-opacity hover:opacity-60 sm:flex"
            >
              Logout
            </button>
          ) : (
            <Link
              href="/login"
              className="hidden h-10 items-center px-3 text-xs uppercase tracking-widest transition-opacity hover:opacity-60 sm:flex"
            >
              Sign In
            </Link>
          )}
          <Link
            href="/saved"
            className="flex h-10 w-10 items-center justify-center transition-opacity hover:opacity-60"
            aria-label="저장됨"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path
                d="M9 15.5l-1-1C4.5 11.5 2 9.3 2 6.5a3.5 3.5 0 017 0 3.5 3.5 0 017 0c0 2.8-2.5 5-6 8l-1 1z"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>
          </Link>
        </div>
      </div>

      {/* Search bar */}
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

      {/* Mobile menu */}
      {menuOpen && (
        <nav className="border-t border-border px-4 py-4 md:hidden">
          {navLinks.map((link) =>
            link.children ? (
              <div key={link.label} className="mb-4">
                <p className="mb-2 text-[10px] uppercase tracking-widest text-muted">
                  {link.label}
                </p>
                {link.children.map((child) => (
                  <Link
                    key={child.href}
                    href={child.href}
                    onClick={() => setMenuOpen(false)}
                    className="block py-2 text-sm"
                  >
                    {child.label}
                  </Link>
                ))}
              </div>
            ) : (
              <Link
                key={link.href}
                href={link.href!}
                onClick={() => setMenuOpen(false)}
                className="block py-2 text-sm uppercase tracking-widest"
              >
                {link.label}
              </Link>
            )
          )}
        </nav>
      )}
    </header>
  );
}
