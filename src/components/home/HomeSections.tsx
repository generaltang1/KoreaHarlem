"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { ProductWithImages } from "@/lib/products";
import { getProductImages, isSoldOut } from "@/lib/products";
import { useCurrency } from "@/context/CurrencyContext";

const SECTIONS = [
  { id: "shop", label: "SHOP" },
  { id: "magazine", label: "MAGAZINE" },
  { id: "think", label: "THINK" },
] as const;

interface HomeSectionsProps {
  products: ProductWithImages[];
}

export function HomeSections({ products }: HomeSectionsProps) {
  const [index, setIndex] = useState(0);
  const [dragPx, setDragPx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(0);
  const startX = useRef<number | null>(null);
  const widthRef = useRef(0);
  const viewportRef = useRef<HTMLDivElement>(null);
  const section = SECTIONS[index];

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const measure = () => {
      const w = el.offsetWidth;
      setViewportWidth(w);
      widthRef.current = w;
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const clampIndex = useCallback((next: number) => {
    return Math.min(SECTIONS.length - 1, Math.max(0, next));
  }, []);

  const go = useCallback(
    (next: number) => {
      setIndex(clampIndex(next));
      setDragPx(0);
      setDragging(false);
    },
    [clampIndex],
  );

  const beginDrag = (clientX: number) => {
    startX.current = clientX;
    widthRef.current = viewportRef.current?.offsetWidth ?? (viewportWidth || 1);
    setDragging(true);
  };

  const moveDrag = (clientX: number) => {
    if (startX.current == null) return;
    let delta = clientX - startX.current;
    if ((index === 0 && delta > 0) || (index === SECTIONS.length - 1 && delta < 0)) {
      delta *= 0.35;
    }
    setDragPx(delta);
  };

  const endDrag = () => {
    if (startX.current == null) return;
    const threshold = Math.max(48, widthRef.current * 0.18);
    const delta = dragPx;
    startX.current = null;
    setDragging(false);

    if (delta <= -threshold) go(index + 1);
    else if (delta >= threshold) go(index - 1);
    else setDragPx(0);
  };

  const offsetX = -index * viewportWidth + dragPx;

  return (
    <section id="home-sections" className="border-t border-border bg-background">
      <div className="mx-auto max-w-5xl px-4 py-10 md:px-6 md:py-14">
        <div className="mb-6 flex items-center justify-between gap-4">
          <p className="text-[10px] uppercase tracking-widest text-muted">Featured</p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => go(index - 1)}
              disabled={index === 0}
              className="flex h-9 w-9 items-center justify-center border border-border text-sm transition-colors hover:border-foreground disabled:opacity-30"
              aria-label="이전 섹션"
            >
              ‹
            </button>
            <p className="min-w-[7rem] text-center text-xs font-medium uppercase tracking-[0.2em]">
              &lt;{section.label}&gt;
            </p>
            <button
              type="button"
              onClick={() => go(index + 1)}
              disabled={index === SECTIONS.length - 1}
              className="flex h-9 w-9 items-center justify-center border border-border text-sm transition-colors hover:border-foreground disabled:opacity-30"
              aria-label="다음 섹션"
            >
              ›
            </button>
          </div>
          {section.id === "shop" ? (
            <Link
              href="/sale"
              className="text-[10px] uppercase tracking-widest text-muted underline-offset-4 hover:text-foreground hover:underline"
            >
              View all
            </Link>
          ) : (
            <span className="w-[4.5rem]" aria-hidden />
          )}
        </div>

        <div
          ref={viewportRef}
          className="cursor-grab touch-pan-y overflow-hidden active:cursor-grabbing"
          onTouchStart={(e) => beginDrag(e.touches[0].clientX)}
          onTouchMove={(e) => moveDrag(e.touches[0].clientX)}
          onTouchEnd={endDrag}
          onTouchCancel={endDrag}
          onMouseDown={(e) => {
            e.preventDefault();
            beginDrag(e.clientX);
          }}
          onMouseMove={(e) => {
            if (startX.current == null) return;
            moveDrag(e.clientX);
          }}
          onMouseUp={endDrag}
          onMouseLeave={() => {
            if (startX.current != null) endDrag();
          }}
        >
          <div
            className="flex will-change-transform"
            style={{
              transform: `translate3d(${offsetX}px, 0, 0)`,
              transition: dragging
                ? "none"
                : "transform 480ms cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          >
            {SECTIONS.map((s) => (
              <div
                key={s.id}
                className="shrink-0 grow-0"
                style={{ width: viewportWidth || "100%" }}
              >
                {s.id === "shop" && <ShopPanel products={products} />}
                {s.id === "magazine" && <ComingSoonPanel label="MAGAZINE" />}
                {s.id === "think" && <ThinkPanel />}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 flex items-center justify-center gap-2">
          {SECTIONS.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => go(i)}
              className={`h-1.5 w-6 transition-colors ${
                i === index ? "bg-foreground" : "bg-border"
              }`}
              aria-label={`${s.label} 섹션`}
              aria-current={i === index}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function ShopPanel({ products }: { products: ProductWithImages[] }) {
  if (products.length === 0) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center border border-border">
        <p className="text-sm text-muted">등록된 상품이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 md:gap-5">
      {products.slice(0, 4).map((product) => (
        <HomeProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

function ThinkPanel() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center border border-border bg-neutral-50 px-6 text-center">
      <p className="text-[10px] uppercase tracking-[0.3em] text-muted">THINK</p>
      <p className="mt-3 text-sm text-muted">자유 게시판</p>
      <Link
        href="/think"
        className="mt-6 border border-foreground px-6 py-2.5 text-[10px] uppercase tracking-widest hover:bg-foreground hover:text-background"
      >
        게시판 보기
      </Link>
    </div>
  );
}

function ComingSoonPanel({ label }: { label: string }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center border border-border bg-neutral-50 px-6 text-center">
      <p className="text-[10px] uppercase tracking-[0.3em] text-muted">{label}</p>
      <p className="mt-3 text-sm text-muted">준비 중입니다.</p>
    </div>
  );
}

function HomeProductCard({ product }: { product: ProductWithImages }) {
  const { formatKrw } = useCurrency();
  const images = getProductImages(product);
  const cover = images[0];
  const soldOut = isSoldOut(product);

  return (
    <Link href={`/sale/${product.id}`} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden bg-neutral-100">
        {cover ? (
          <Image
            src={cover}
            alt={product.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width:768px) 50vw, 40vw"
            draggable={false}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted">
            No image
          </div>
        )}
        {soldOut && (
          <span className="absolute right-2 top-2 bg-background/90 px-1.5 py-0.5 text-[10px] uppercase tracking-widest">
            Sold out
          </span>
        )}
      </div>
      <div className="mt-2.5 space-y-0.5">
        <h3 className="line-clamp-2 text-[11px] leading-snug md:text-xs">{product.title}</h3>
        <p className="text-[11px] text-muted md:text-xs">{formatKrw(product.price_krw)}</p>
      </div>
    </Link>
  );
}
