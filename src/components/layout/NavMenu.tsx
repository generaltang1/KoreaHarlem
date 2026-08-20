"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { NavItem } from "@/data/navigation";

function DesktopSubMenu({
  items,
  open,
  onNavigate,
}: {
  items: NavItem[];
  open: boolean;
  onNavigate: () => void;
}) {
  const [openSub, setOpenSub] = useState<string | null>(null);

  useEffect(() => {
    if (!open) setOpenSub(null);
  }, [open]);

  return (
    <div
      className={`absolute left-0 top-full z-50 min-w-[180px] border border-border bg-background py-2 transition-all ${
        open
          ? "visible opacity-100"
          : "invisible pointer-events-none opacity-0"
      }`}
    >
      {items.map((item) =>
        item.children ? (
          <div key={item.label} className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setOpenSub((prev) => (prev === item.label ? null : item.label));
              }}
              className="flex w-full items-center justify-between gap-3 px-4 py-2 text-left text-xs text-muted transition-colors hover:bg-foreground hover:text-background"
              aria-expanded={openSub === item.label}
            >
              <span>{item.label}</span>
              <span aria-hidden className="text-[10px]">
                ›
              </span>
            </button>
            <div
              className={`absolute left-full top-0 z-50 hidden min-w-[160px] border border-border bg-background py-2 transition-all lg:block ${
                openSub === item.label
                  ? "visible opacity-100"
                  : "invisible pointer-events-none opacity-0"
              }`}
            >
              {item.children.map((child) => (
                <Link
                  key={child.href}
                  href={child.href!}
                  onClick={onNavigate}
                  className="block px-4 py-2 text-xs transition-colors hover:bg-foreground hover:text-background"
                >
                  {child.label}
                </Link>
              ))}
            </div>
            {openSub === item.label && (
              <div className="border-t border-border bg-neutral-50 py-1 lg:hidden">
                {item.children.map((child) => (
                  <Link
                    key={`inline-${child.href}`}
                    href={child.href!}
                    onClick={onNavigate}
                    className="block px-6 py-2 text-xs transition-colors hover:bg-foreground hover:text-background"
                  >
                    {child.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ) : (
          <Link
            key={item.href ?? item.label}
            href={item.href!}
            onClick={onNavigate}
            className="block px-4 py-2 text-xs transition-colors hover:bg-foreground hover:text-background"
          >
            {item.label}
          </Link>
        ),
      )}
    </div>
  );
}

function DesktopDropdown({
  label,
  items,
  open,
  onToggle,
  onClose,
}: {
  label: string;
  items: NavItem[];
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) onClose();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={onToggle}
        className="text-xs uppercase tracking-widest transition-opacity hover:opacity-60"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        {label}
      </button>
      <DesktopSubMenu items={items} open={open} onNavigate={onClose} />
    </div>
  );
}

function MobileNavItems({
  items,
  depth = 0,
  onNavigate,
}: {
  items: NavItem[];
  depth?: number;
  onNavigate: () => void;
}) {
  return (
    <>
      {items.map((item) =>
        item.children ? (
          <div key={item.label} className={depth === 0 ? "mb-4" : "mb-2"}>
            <p
              className={
                depth === 0
                  ? "mb-2 text-[10px] uppercase tracking-widest text-muted"
                  : "mb-1 pl-2 text-[10px] uppercase tracking-widest text-muted"
              }
            >
              {item.label}
            </p>
            <MobileNavItems items={item.children} depth={depth + 1} onNavigate={onNavigate} />
          </div>
        ) : (
          <Link
            key={item.href}
            href={item.href!}
            onClick={onNavigate}
            className={`block py-2 text-sm ${depth > 0 ? "pl-4" : "uppercase tracking-widest"}`}
          >
            {item.label}
          </Link>
        ),
      )}
    </>
  );
}

export function DesktopNavMenu({ items }: { items: NavItem[] }) {
  const [openLabel, setOpenLabel] = useState<string | null>(null);

  return (
    <>
      {items.map((link) =>
        link.children ? (
          <DesktopDropdown
            key={link.label}
            label={link.label}
            items={link.children}
            open={openLabel === link.label}
            onToggle={() =>
              setOpenLabel((prev) => (prev === link.label ? null : link.label))
            }
            onClose={() => setOpenLabel(null)}
          />
        ) : (
          <Link
            key={link.href}
            href={link.href!}
            className="text-xs uppercase tracking-widest transition-opacity hover:opacity-60"
          >
            {link.label}
          </Link>
        ),
      )}
    </>
  );
}

export function MobileNavMenu({ items, onNavigate }: { items: NavItem[]; onNavigate: () => void }) {
  return <MobileNavItems items={items} onNavigate={onNavigate} />;
}
