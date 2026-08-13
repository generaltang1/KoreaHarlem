"use client";

import Link from "next/link";
import type { NavItem } from "@/data/navigation";

function DesktopSubMenu({ items }: { items: NavItem[] }) {
  return (
    <div className="invisible absolute left-0 top-full z-50 min-w-[180px] border border-border bg-background py-2 opacity-0 transition-all group-hover:visible group-hover:opacity-100">
      {items.map((item) =>
        item.children ? (
          <div key={item.label} className="group/sub relative">
            <span className="block px-4 py-2 text-xs text-muted">{item.label}</span>
            <div className="invisible absolute left-full top-0 z-50 min-w-[160px] border border-border bg-background py-2 opacity-0 transition-all group-hover/sub:visible group-hover/sub:opacity-100">
              {item.children.map((child) => (
                <Link
                  key={child.href}
                  href={child.href!}
                  className="block px-4 py-2 text-xs transition-colors hover:bg-foreground hover:text-background"
                >
                  {child.label}
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <Link
            key={item.href ?? item.label}
            href={item.href!}
            className="block px-4 py-2 text-xs transition-colors hover:bg-foreground hover:text-background"
          >
            {item.label}
          </Link>
        ),
      )}
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
  return (
    <>
      {items.map((link) =>
        link.children ? (
          <div key={link.label} className="group relative">
            <button type="button" className="text-xs uppercase tracking-widest transition-opacity hover:opacity-60">
              {link.label}
            </button>
            <DesktopSubMenu items={link.children} />
          </div>
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
