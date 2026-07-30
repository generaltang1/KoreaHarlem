"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { ProductWithImages } from "@/lib/products";
import { getProductImages, isSoldOut } from "@/lib/products";
import { useCurrency } from "@/context/CurrencyContext";
import { QuickViewModal } from "@/components/commerce/QuickViewModal";

interface ProductCardProps {
  product: ProductWithImages;
}

export function ProductCard({ product }: ProductCardProps) {
  const { formatKrw } = useCurrency();
  const images = getProductImages(product);
  const [hovered, setHovered] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const soldOut = isSoldOut(product);
  const showSecond = hovered && images.length > 1;
  const activeImage = showSecond ? images[1] : images[0];

  return (
    <>
      <article
        className="group"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div className="relative aspect-[3/4] overflow-hidden bg-neutral-100">
          <Link href={`/sale/${product.id}`} className="absolute inset-0 block">
            {activeImage ? (
              <Image
                src={activeImage}
                alt={product.title}
                fill
                className="object-cover transition-opacity duration-300"
                sizes="(max-width:768px) 50vw, 20vw"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-muted">No image</div>
            )}
          </Link>

          <div className="pointer-events-none absolute right-2 top-2 text-[10px] uppercase tracking-widest">
            {soldOut ? (
              <span className="bg-background/90 px-1.5 py-0.5">Sold out</span>
            ) : product.is_sale ? (
              <span className="bg-background/90 px-1.5 py-0.5">Sale</span>
            ) : null}
          </div>

          {!soldOut && (
            <button
              type="button"
              onClick={() => setQuickOpen(true)}
              className={`absolute bottom-3 left-1/2 z-10 -translate-x-1/2 border border-border bg-background px-4 py-2 text-[10px] uppercase tracking-widest shadow-sm transition-all ${
                hovered ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
              }`}
            >
              Choose
            </button>
          )}
        </div>

        <Link href={`/sale/${product.id}`} className="mt-3 block space-y-1">
          <h3 className="text-sm leading-snug">{product.title}</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-medium">{formatKrw(product.price_krw)}</span>
            {product.compare_at_price_krw != null &&
              product.compare_at_price_krw > product.price_krw && (
                <span className="text-xs text-muted line-through">
                  {formatKrw(product.compare_at_price_krw)}
                </span>
              )}
          </div>
        </Link>
      </article>

      {quickOpen && (
        <QuickViewModal product={product} onClose={() => setQuickOpen(false)} />
      )}
    </>
  );
}
