"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { ProductWithImages } from "@/lib/products";
import { getProductImages, isPurchasable, isSoldOut } from "@/lib/products";
import { getStockForSize } from "@/lib/stock";
import { productCategoryLabel } from "@/lib/productCategories";
import { useCart } from "@/context/CartContext";
import { useCurrency } from "@/context/CurrencyContext";
import { site } from "@/lib/siteTheme";

interface QuickViewModalProps {
  product: ProductWithImages;
  onClose: () => void;
}

export function QuickViewModal({ product, onClose }: QuickViewModalProps) {
  const images = getProductImages(product);
  const { formatKrw } = useCurrency();
  const { addItem, openCart } = useCart();
  const [size, setSize] = useState(product.sizes[0] ?? "");
  const [qty, setQty] = useState(1);
  const needsSize = product.sizes.length > 0;
  const purchasable = isPurchasable(product);
  const soldOut = isSoldOut({ ...product, sizeStocks: product.sizeStocks });
  const showStock = product.show_stock !== false;
  const sizeStocks = product.sizeStocks ?? {};
  const stockForSize = getStockForSize(sizeStocks, needsSize ? size : "");
  const sizeSoldOut = (s: string) => getStockForSize(sizeStocks, s) <= 0;

  const categoryLabel = useMemo(
    () => productCategoryLabel(product.category, product.subcategory),
    [product.category, product.subcategory],
  );

  const addToCart = () => {
    if (!purchasable || soldOut) return;
    if (needsSize && !size) return;
    if (needsSize && sizeSoldOut(size)) return;
    addItem({
      productId: product.id,
      title: product.title,
      imageUrl: images[0],
      size: size || null,
      priceKrw: product.price_krw,
      quantity: qty,
    });
    onClose();
    openCart();
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
        aria-label="닫기"
      />
      <div
        className={`relative grid w-full max-w-[880px] overflow-hidden rounded-[12px] border border-[rgba(244,241,234,0.12)] bg-[#141414]/95 text-[#f4f1ea] shadow-[0_0_60px_rgba(0,0,0,0.55)] backdrop-blur-[10px] md:grid-cols-[400px_1fr] ${site.font}`}
      >
        <div className="relative min-h-[280px] bg-white md:min-h-[520px]">
          {images[0] ? (
            <Image src={images[0]} alt={product.title} fill className="object-cover" sizes="400px" />
          ) : (
            <div className="flex h-full min-h-[280px] items-center justify-center text-xs text-neutral-400 md:min-h-[520px]">
              No image
            </div>
          )}
        </div>

        <div className="relative flex flex-col p-6 md:p-8">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-[8px] text-[#a8a49b] transition-colors hover:bg-[rgba(244,241,234,0.06)] hover:text-[#f4f1ea]"
            aria-label="닫기"
          >
            ✕
          </button>

          <p className="pr-10 text-[11px] font-medium tracking-wide text-[#FEE500]">
            {categoryLabel.toUpperCase()}
          </p>
          <h2 className="mt-3 pr-8 text-2xl font-bold leading-snug tracking-tight">
            {product.title}
          </h2>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-xl font-semibold">{formatKrw(product.price_krw)}</span>
            {product.compare_at_price_krw != null &&
              product.compare_at_price_krw > product.price_krw && (
                <span className="text-sm text-neutral-500 line-through">
                  {formatKrw(product.compare_at_price_krw)}
                </span>
              )}
          </div>

          {needsSize && (
            <div className="mt-6">
              <p className="mb-2 text-xs text-neutral-300">사이즈</p>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((s) => {
                  const out = sizeSoldOut(s);
                  const selected = size === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      disabled={out}
                      onClick={() => !out && setSize(s)}
                      className={`relative min-w-14 rounded-[8px] border px-3 py-2.5 text-xs transition-colors ${
                        out
                          ? "cursor-not-allowed border-[rgba(244,241,234,0.08)] text-[#6e6b65]"
                          : selected
                            ? "border-[#f4f1ea] bg-[#f4f1ea] font-semibold text-[#0a0a0a]"
                            : "border-[rgba(244,241,234,0.12)] text-[#f4f1ea] hover:bg-[rgba(244,241,234,0.06)]"
                      }`}
                    >
                      <span className={out ? "line-through" : ""}>{s}</span>
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-[11px] text-neutral-500">
                품절 사이즈는 선택할 수 없어요. 재고 표시는 상품별로 켜질 수 있어요.
              </p>
            </div>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <span className="text-xs text-neutral-300">수량</span>
            <div className="inline-flex items-center overflow-hidden rounded-[8px] border border-[rgba(244,241,234,0.12)] bg-[rgba(244,241,234,0.05)]">
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center text-neutral-300 hover:text-white"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                aria-label="수량 감소"
              >
                −
              </button>
              <span className="w-8 text-center text-sm tabular-nums">{qty}</span>
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center text-neutral-300 hover:text-white"
                onClick={() =>
                  setQty((q) => {
                    if (showStock && stockForSize > 0) return Math.min(stockForSize, q + 1);
                    return q + 1;
                  })
                }
                aria-label="수량 증가"
              >
                +
              </button>
            </div>
            {showStock && (
              <span className="text-[11px] text-neutral-500">
                남은 재고 {Number.isFinite(stockForSize) ? stockForSize : "—"}
              </span>
            )}
          </div>

          <div className="mt-auto space-y-3 pt-8">
            {!purchasable || soldOut ? (
              <p className="rounded-[8px] border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-center text-xs text-amber-200">
                {soldOut ? "품절된 상품입니다." : "판매 준비 중인 상품입니다."}
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={addToCart}
                  className={site.ghostBtn}
                >
                  장바구니 담기
                </button>
                <Link
                  href={`/checkout?buy=${product.id}${size ? `&size=${encodeURIComponent(size)}` : ""}${qty > 1 ? `&qty=${qty}` : ""}`}
                  onClick={onClose}
                  className={site.creamBtn}
                >
                  바로 구매
                </Link>
              </div>
            )}
            <Link
              href={`/sale/${product.id}`}
              onClick={onClose}
              className="inline-block text-xs text-[#a8a49b] underline-offset-2 hover:text-[#f4f1ea] hover:underline"
            >
              상품 상세 보기 →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
