"use client";

import { useCallback, useRef, useState } from "react";
import Image from "next/image";

interface ProductImageZoomProps {
  src: string;
  alt: string;
}

/** 렌즈(선택 영역) 크기 — 작을수록 확대 배율이 커짐 */
const LENS = 100;
/** 우측 확대 미리보기 (정사각형) */
const PREVIEW = 340;

export function ProductImageZoom({ src, alt }: ProductImageZoomProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const [pos, setPos] = useState({
    lensLeft: 0,
    lensTop: 0,
    w: 1,
    h: 1,
  });

  const onMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const lensLeft = Math.max(0, Math.min(x - LENS / 2, rect.width - LENS));
    const lensTop = Math.max(0, Math.min(y - LENS / 2, rect.height - LENS));
    setPos({ lensLeft, lensTop, w: rect.width, h: rect.height });
  }, []);

  // 렌즈 영역이 미리보기 정사각형을 가득 채우도록 확대
  const mag = PREVIEW / LENS;

  return (
    <div className="relative">
      <div
        ref={containerRef}
        className="relative aspect-[3/4] w-full cursor-crosshair overflow-hidden bg-neutral-100"
        onMouseEnter={() => setActive(true)}
        onMouseLeave={() => setActive(false)}
        onMouseMove={onMove}
      >
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover"
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
          draggable={false}
        />

        {active && (
          <div
            className="pointer-events-none absolute z-10 border border-neutral-400/80 bg-neutral-500/25"
            style={{
              width: LENS,
              height: LENS,
              left: pos.lensLeft,
              top: pos.lensTop,
            }}
          />
        )}
      </div>

      {/* 렌즈 안 픽셀을 PREVIEW 크기로 확대해 보여줌 */}
      <div
        className={`pointer-events-none absolute left-[calc(100%+0.75rem)] top-0 z-30 hidden overflow-hidden border border-border bg-neutral-100 shadow-xl lg:block ${
          active ? "opacity-100" : "opacity-0"
        }`}
        style={{ width: PREVIEW, height: PREVIEW }}
        aria-hidden
      >
        <div
          className="absolute"
          style={{
            width: pos.w * mag,
            height: pos.h * mag,
            left: -pos.lensLeft * mag,
            top: -pos.lensTop * mag,
          }}
        >
          <div className="relative h-full w-full">
            <Image
              src={src}
              alt=""
              fill
              className="object-cover"
              sizes={`${Math.ceil(pos.w * mag)}px`}
              draggable={false}
              quality={95}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
