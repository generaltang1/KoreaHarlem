"use client";

import { useCallback, useRef, useState } from "react";
import Image from "next/image";

interface ProductImageZoomProps {
  src: string;
  alt: string;
}

const ZOOM = 2.2;
const LENS = 120;

export function ProductImageZoom({ src, alt }: ProductImageZoomProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0, w: 1, h: 1 });

  const onMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));
    setPos({ x, y, w: rect.width, h: rect.height });
  }, []);

  const bgX = pos.w > 0 ? (pos.x / pos.w) * 100 : 50;
  const bgY = pos.h > 0 ? (pos.y / pos.h) * 100 : 50;

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:gap-6">
      <div
        ref={containerRef}
        className="relative aspect-[3/4] w-full overflow-hidden bg-neutral-100 lg:flex-1"
        onMouseEnter={() => setActive(true)}
        onMouseLeave={() => setActive(false)}
        onMouseMove={onMove}
      >
        <Image src={src} alt={alt} fill className="object-cover" priority sizes="(max-width: 768px) 100vw, 50vw" />
        {active && (
          <div
            className="pointer-events-none absolute border border-foreground/40 bg-white/20"
            style={{
              width: LENS,
              height: LENS,
              left: Math.max(0, Math.min(pos.x - LENS / 2, pos.w - LENS)),
              top: Math.max(0, Math.min(pos.y - LENS / 2, pos.h - LENS)),
            }}
          />
        )}
        <p className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 text-[10px] text-white lg:hidden">
          마우스를 올려보세요
        </p>
      </div>

      {active && (
        <div
          className="hidden aspect-[3/4] flex-1 overflow-hidden border border-border bg-neutral-100 lg:block"
          style={{
            backgroundImage: `url(${src})`,
            backgroundRepeat: "no-repeat",
            backgroundSize: `${pos.w * ZOOM}px ${pos.h * ZOOM}px`,
            backgroundPosition: `${bgX}% ${bgY}%`,
          }}
          aria-hidden
        />
      )}
    </div>
  );
}
