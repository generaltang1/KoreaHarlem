"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { ProductWithImages } from "@/lib/products";
import { getProductImages, isPurchasable, isSoldOut } from "@/lib/products";
import { getStockForSize } from "@/lib/stock";
import { useCart } from "@/context/CartContext";
import { useCurrency } from "@/context/CurrencyContext";
import { QuickViewModal } from "@/components/commerce/QuickViewModal";
import { site } from "@/lib/siteTheme";

interface ProductCardProps {
  product: ProductWithImages;
}

function stockMeta(product: ProductWithImages) {
  const soldOut = isSoldOut(product);
  const showStock = product.show_stock !== false;
  const sizes = product.sizes ?? [];
  const sizeStocks = product.sizeStocks ?? {};

  if (soldOut) {
    return { kind: "sold" as const, label: "품절" };
  }

  if (sizes.length > 0) {
    const available = sizes.filter((s) => getStockForSize(sizeStocks, s) > 0);
    const total = available.reduce((sum, s) => sum + getStockForSize(sizeStocks, s), 0);
    if (showStock && total === 1) {
      return { kind: "low" as const, label: "단 1개" };
    }
    if (available.length > 0) {
      return {
        kind: "ok" as const,
        label: `사이즈 ${available[0]}${available.length > 1 ? ` – ${available[available.length - 1]}` : ""}`,
      };
    }
  }

  const stock = getStockForSize(sizeStocks, "");
  if (showStock && stock === 1) return { kind: "low" as const, label: "단 1개" };
  if (showStock && stock > 0) return { kind: "ok" as const, label: "재고 있음" };
  return { kind: "ok" as const, label: "재고 있음" };
}

export function ProductCard({ product }: ProductCardProps) {
  const { formatKrw } = useCurrency();
  const { addItem, openCart } = useCart();
  const images = getProductImages(product);
  const [hovered, setHovered] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const soldOut = isSoldOut(product);
  const purchasable = isPurchasable(product);
  const showSecond = hovered && images.length > 1;
  const activeImage = showSecond ? images[1] : images[0];
  const needsOption =
    product.category === "ticket" || (product.sizes?.length ?? 0) > 0;
  const meta = useMemo(() => stockMeta(product), [product]);

  const handleCartClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!purchasable || soldOut) return;
    if (needsOption) {
      setQuickOpen(true);
      return;
    }
    addItem({
      productId: product.id,
      title: product.title,
      imageUrl: images[0],
      size: null,
      priceKrw: product.price_krw,
      quantity: 1,
      kind: "product",
    });
    openCart();
  };

  return (
    <>
      <article
        className={`group flex flex-col ${site.font}`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div className="relative aspect-[3/4] overflow-hidden rounded-[4px] border border-[rgba(244,241,234,0.12)] bg-[#151515]">
          <Link href={`/sale/${product.id}`} className="absolute inset-0 block">
            {activeImage ? (
              <Image
                src={activeImage}
                alt={product.title}
                fill
                className="object-cover transition-opacity duration-300"
                sizes="(max-width:768px) 50vw, 33vw"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-[#6e6b65]">
                No image
              </div>
            )}
          </Link>

          {(soldOut || !purchasable) && (
            <div className="pointer-events-none absolute right-2 top-2 text-[10px] uppercase tracking-widest">
              <span className="rounded bg-black/80 px-1.5 py-0.5 text-[#f4f1ea]">
                {soldOut ? "Sold out" : "Coming soon"}
              </span>
            </div>
          )}
        </div>

        <div className="mt-3 flex flex-1 flex-col gap-2">
          <Link href={`/sale/${product.id}`} className="block space-y-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-sm leading-snug text-[#f4f1ea]">{product.title}</h3>
              <span className="shrink-0 text-sm font-medium text-[#f4f1ea]">
                {formatKrw(product.price_krw)}
              </span>
            </div>
            {product.category === "ticket" && (
              <p className="text-[11px] text-[#a8a49b]">
                {[
                  product.event_starts_at
                    ? new Date(product.event_starts_at).toLocaleDateString("ko-KR")
                    : null,
                  product.venue,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            )}
          </Link>

          <div className="mt-auto flex items-center justify-between gap-2 pt-1">
            <p className="flex items-center gap-1.5 text-[11px] text-[#a8a49b]">
              {meta.kind === "sold" ? (
                <span className="h-1.5 w-1.5 rounded-full bg-[#6e6b65]" />
              ) : meta.kind === "low" ? (
                <span className="h-1.5 w-1.5 rounded-full bg-[#f87171]" />
              ) : (
                <span className="h-1.5 w-1.5 rounded-full bg-[#4ade80]" />
              )}
              {meta.label}
            </p>
            <button
              type="button"
              disabled={!purchasable || soldOut}
              onClick={handleCartClick}
              className="shrink-0 rounded-[6px] border border-[rgba(244,241,234,0.2)] px-2.5 py-1.5 text-[10px] text-[#f4f1ea] transition hover:bg-[rgba(244,241,234,0.08)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              + 장바구니 담기
            </button>
          </div>
        </div>
      </article>

      {quickOpen && (
        <QuickViewModal product={product} onClose={() => setQuickOpen(false)} />
      )}
    </>
  );
}
