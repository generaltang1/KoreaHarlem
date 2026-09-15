"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { NavItem } from "@/data/navigation";

type NavVariant = "light" | "dark";

function DesktopSubMenu({
  items,
  open,
  onNavigate,
  variant,
}: {
  items: NavItem[];
  open: boolean;
  onNavigate: () => void;
  variant: NavVariant;
}) {
  const [openSub, setOpenSub] = useState<string | null>(null);
  const dark = variant === "dark";

  useEffect(() => {
    if (!open) setOpenSub(null);
  }, [open]);

  const panel = dark
    ? "border-neutral-800 bg-[#0a0a0c]/95 backdrop-blur-md"
    : "border-border bg-background";
  const itemCls = dark
    ? "block px-4 py-2 text-xs font-mono text-neutral-300 transition-colors hover:bg-neutral-800/50 hover:text-white"
    : "block px-4 py-2 text-xs transition-colors hover:bg-foreground hover:text-background";
  const mutedBtn = dark
    ? "flex w-full items-center justify-between gap-3 px-4 py-2 text-left text-xs font-mono text-neutral-300 transition-colors hover:bg-neutral-800/50 hover:text-white"
    : "flex w-full items-center justify-between gap-3 px-4 py-2 text-left text-xs text-muted transition-colors hover:bg-foreground hover:text-background";

  return (
    <div
      className={`absolute left-0 top-full z-50 min-w-[180px] border py-2 transition-all ${panel} ${
        open ? "visible opacity-100" : "invisible pointer-events-none opacity-0"
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
              className={mutedBtn}
              aria-expanded={openSub === item.label}
            >
              <span>{item.label}</span>
              <span aria-hidden className="text-[10px]">
                ›
              </span>
            </button>
            <div
              className={`absolute left-full top-0 z-50 hidden min-w-[160px] border py-2 transition-all lg:block ${panel} ${
                openSub === item.label
                  ? "visible opacity-100"
                  : "invisible pointer-events-none opacity-0"
              }`}
            >
              {item.children.map((child) => (
                <Link key={child.href} href={child.href!} onClick={onNavigate} className={itemCls}>
                  {child.label}
                </Link>
              ))}
            </div>
            {openSub === item.label && (
              <div
                className={`border-t py-1 lg:hidden ${dark ? "border-neutral-800 bg-neutral-950" : "border-border bg-neutral-50"}`}
              >
                {item.children.map((child) => (
                  <Link
                    key={`inline-${child.href}`}
                    href={child.href!}
                    onClick={onNavigate}
                    className={`${itemCls} px-6`}
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
            className={itemCls}
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
  variant,
}: {
  label: string;
  items: NavItem[];
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  variant: NavVariant;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const dark = variant === "dark";

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
        className={
          dark
            ? "font-mono text-xs uppercase tracking-wider text-neutral-300 transition-colors hover:text-white"
            : "text-xs uppercase tracking-widest transition-opacity hover:opacity-60"
        }
        aria-expanded={open}
        aria-haspopup="menu"
      >
        {label}
      </button>
      <DesktopSubMenu items={items} open={open} onNavigate={onClose} variant={variant} />
    </div>
  );
}

function MobileNavItems({
  items,
  depth = 0,
  onNavigate,
  variant,
}: {
  items: NavItem[];
  depth?: number;
  onNavigate: () => void;
  variant: NavVariant;
}) {
  const dark = variant === "dark";
  return (
    <>
      {items.map((item) =>
        item.children ? (
          <div key={item.label} className={depth === 0 ? "mb-4" : "mb-2"}>
            <p
              className={
                depth === 0
                  ? `mb-2 text-[10px] uppercase tracking-widest ${dark ? "text-neutral-500" : "text-muted"}`
                  : `mb-1 pl-2 text-[10px] uppercase tracking-widest ${dark ? "text-neutral-500" : "text-muted"}`
              }
            >
              {item.label}
            </p>
            <MobileNavItems
              items={item.children}
              depth={depth + 1}
              onNavigate={onNavigate}
              variant={variant}
            />
          </div>
        ) : (
          <Link
            key={item.href}
            href={item.href!}
            onClick={onNavigate}
            className={`block py-2 text-sm ${depth > 0 ? "pl-4" : "uppercase tracking-widest"} ${
              dark ? "text-neutral-200" : ""
            }`}
          >
            {item.label}
          </Link>
        ),
      )}
    </>
  );
}

export function DesktopNavMenu({
  items,
  variant = "light",
}: {
  items: NavItem[];
  variant?: NavVariant;
}) {
  const [openLabel, setOpenLabel] = useState<string | null>(null);
  const dark = variant === "dark";

  return (
    <>
      {items.map((link) =>
        link.children ? (
          <DesktopDropdown
            key={link.label}
            label={link.label}
            items={link.children}
            open={openLabel === link.label}
            onToggle={() => setOpenLabel((prev) => (prev === link.label ? null : link.label))}
            onClose={() => setOpenLabel(null)}
            variant={variant}
          />
        ) : (
          <Link
            key={link.href}
            href={link.href!}
            className={
              dark
                ? "font-mono text-xs uppercase tracking-wider text-neutral-300 transition-colors hover:text-white"
                : "text-xs uppercase tracking-widest transition-opacity hover:opacity-60"
            }
          >
            {link.label}
          </Link>
        ),
      )}
    </>
  );
}

export function MobileNavMenu({
  items,
  onNavigate,
  variant = "light",
}: {
  items: NavItem[];
  onNavigate: () => void;
  variant?: NavVariant;
}) {
  return <MobileNavItems items={items} onNavigate={onNavigate} variant={variant} />;
}
