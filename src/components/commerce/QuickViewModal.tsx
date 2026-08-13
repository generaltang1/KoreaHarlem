"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { ProductWithImages } from "@/lib/products";
import { getProductImages, isPurchasable } from "@/lib/products";
import { useCart } from "@/context/CartContext";
import { useCurrency } from "@/context/CurrencyContext";

interface QuickViewModalProps {
  product: ProductWithImages;
  onClose: () => void;
}

export function QuickViewModal({ product, onClose }: QuickViewModalProps) {
  const images = getProductImages(product);
  const { formatKrw } = useCurrency();
  const { addItem } = useCart();
  const [size, setSize] = useState(product.sizes[0] ?? "");
  const needsSize = product.sizes.length > 0;
  const purchasable = isPurchasable(product);

  const addToCart = () => {
    if (!purchasable) return;
    if (needsSize && !size) return;
    addItem({
      productId: product.id,
      title: product.title,
      imageUrl: images[0],
      size: size || null,
      priceKrw: product.price_krw,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-black/50" onClick={onClose} aria-label="닫기" />
      <div className="relative grid w-full max-w-3xl gap-6 border border-border bg-background p-5 md:grid-cols-2 md:p-6">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 text-xs uppercase tracking-widest text-muted"
        >
          Close
        </button>

        <div className="space-y-2">
          {images.slice(0, 2).map((url) => (
            <div key={url} className="relative aspect-square overflow-hidden bg-neutral-100">
              <Image src={url} alt={product.title} fill className="object-cover" />
            </div>
          ))}
          {images.length === 0 && (
            <div className="flex aspect-square items-center justify-center bg-neutral-100 text-xs text-muted">
              No image
            </div>
          )}
        </div>

        <div className="flex flex-col">
          <h2 className="pr-10 text-lg font-medium leading-snug">{product.title}</h2>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-base font-medium">{formatKrw(product.price_krw)}</span>
            {product.compare_at_price_krw != null &&
              product.compare_at_price_krw > product.price_krw && (
                <span className="text-sm text-muted line-through">
                  {formatKrw(product.compare_at_price_krw)}
                </span>
              )}
          </div>

          {needsSize && (
            <div className="mt-6">
              <p className="mb-2 text-[10px] uppercase tracking-widest text-muted">Size</p>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSize(s)}
                    className={`min-w-10 border px-3 py-2 text-xs ${
                      size === s
                        ? "border-foreground bg-foreground text-background"
                        : "border-border"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-auto space-y-2 pt-8">
            {!purchasable ? (
              <p className="border border-amber-200 bg-amber-50 px-4 py-3 text-center text-xs text-amber-900">
                판매 준비 중인 상품입니다.
              </p>
            ) : (
              <>
                <button
                  type="button"
                  onClick={addToCart}
                  className="flex w-full items-center justify-center gap-2 bg-foreground py-3 text-xs uppercase tracking-widest text-background"
                >
                  Add to cart
                </button>
                <Link
                  href={`/checkout?buy=${product.id}${size ? `&size=${encodeURIComponent(size)}` : ""}`}
                  onClick={onClose}
                  className="flex w-full items-center justify-center border border-border py-3 text-xs uppercase tracking-widest"
                >
                  Buy now
                </Link>
              </>
            )}
            <Link
              href={`/sale/${product.id}`}
              onClick={onClose}
              className="block pt-2 text-center text-[10px] uppercase tracking-widest text-muted underline"
            >
              View details
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
