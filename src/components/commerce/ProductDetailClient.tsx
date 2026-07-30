"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ProductDetail } from "@/lib/productDetail";
import { buildCheckoutQuery } from "@/lib/productDetail";
import { getProductImages, isSoldOut } from "@/lib/products";
import { getStockForSize } from "@/lib/stock";
import { calcShippingFee, formatShippingLabel } from "@/lib/shipping";
import { useCart } from "@/context/CartContext";
import { useCurrency } from "@/context/CurrencyContext";
import { createClient } from "@/lib/supabase/client";
import { ProductImageZoom } from "@/components/commerce/ProductImageZoom";
import { SizeGuideModal } from "@/components/commerce/SizeGuideModal";

const MAX_QTY = 10;

interface AddonPick {
  productId: string;
  size: string;
}

interface ProductDetailClientProps {
  product: ProductDetail;
  initialWishlisted: boolean;
  isLoggedIn: boolean;
}

export function ProductDetailClient({
  product,
  initialWishlisted,
  isLoggedIn,
}: ProductDetailClientProps) {
  const router = useRouter();
  const supabase = createClient();
  const images = getProductImages(product);
  const { formatKrw } = useCurrency();
  const { addItem } = useCart();

  const [imageIndex, setImageIndex] = useState(0);
  const [size, setSize] = useState(product.sizes[0] ?? "");
  const [quantity, setQuantity] = useState(1);
  const [addonPicks, setAddonPicks] = useState<Record<string, AddonPick>>({});
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [wishlisted, setWishlisted] = useState(initialWishlisted);
  const [wishLoading, setWishLoading] = useState(false);
  const [message, setMessage] = useState("");

  const soldOut = isSoldOut({ ...product, sizeStocks: product.sizeStocks });
  const needsSize = product.sizes.length > 0;
  const mainImage = images[imageIndex] ?? images[0];

  const availableForSize = getStockForSize(product.sizeStocks, needsSize ? size : "");
  const maxQty = Math.min(MAX_QTY, Math.max(availableForSize, 0));

  const selectedAddons = useMemo(() => {
    return product.addons
      .map(({ addon }) => {
        const pick = addonPicks[addon.id];
        if (!pick) return null;
        const addonNeedsSize = addon.sizes.length > 0;
        if (addonNeedsSize && !pick.size) return null;
        const addonImages = getProductImages(addon);
        return {
          productId: addon.id,
          title: addon.title,
          priceKrw: addon.price_krw,
          imageUrl: addonImages[0],
          size: pick.size || null,
        };
      })
      .filter(Boolean) as {
      productId: string;
      title: string;
      priceKrw: number;
      imageUrl?: string;
      size: string | null;
    }[];
  }, [product.addons, addonPicks]);

  const merchandiseKrw = useMemo(() => {
    const main = product.price_krw * quantity;
    const addons = selectedAddons.reduce((sum, a) => sum + a.priceKrw, 0);
    return main + addons;
  }, [product.price_krw, quantity, selectedAddons]);

  const shippingKrw = useMemo(
    () =>
      calcShippingFee(
        merchandiseKrw,
        product.shipping_fee_krw,
        product.free_shipping_threshold_krw,
      ),
    [merchandiseKrw, product.shipping_fee_krw, product.free_shipping_threshold_krw],
  );

  const totalKrw = merchandiseKrw + shippingKrw;
  const lineCount = 1 + selectedAddons.length;

  const validate = () => {
    if (soldOut) return "품절된 상품입니다.";
    if (needsSize && !size) return "사이즈를 선택해주세요.";
    if (needsSize && getStockForSize(product.sizeStocks, size) <= 0) {
      return "선택한 사이즈는 품절입니다.";
    }
    if (!needsSize && availableForSize <= 0) return "품절된 상품입니다.";
    if (quantity > maxQty) return `최대 ${maxQty}개까지 주문할 수 있습니다.`;
    for (const { addon } of product.addons) {
      const pick = addonPicks[addon.id];
      if (!pick) continue;
      if (addon.sizes.length > 0 && !pick.size) {
        return `"${addon.title}" 사이즈를 선택해주세요.`;
      }
      const addonStock = getStockForSize(addon.sizeStocks ?? {}, pick.size);
      if (addonStock <= 0) {
        return `"${addon.title}" 선택 옵션은 품절입니다.`;
      }
    }
    return null;
  };

  const addAllToCart = () => {
    const err = validate();
    if (err) {
      setMessage(err);
      return;
    }
    setMessage("");
    addItem({
      productId: product.id,
      title: product.title,
      imageUrl: images[0],
      size: size || null,
      priceKrw: product.price_krw,
      quantity,
    });
    for (const addon of selectedAddons) {
      addItem({
        productId: addon.productId,
        title: addon.title,
        imageUrl: addon.imageUrl,
        size: addon.size,
        priceKrw: addon.priceKrw,
        quantity: 1,
      });
    }
  };

  const buildAuthUrl = () => {
    const err = validate();
    if (err) {
      setMessage(err);
      return null;
    }
    const q = buildCheckoutQuery({
      buy: product.id,
      size: size || undefined,
      qty: quantity,
      addons: selectedAddons,
    });
    return `/checkout/auth?${q}`;
  };

  const handleBuyNow = () => {
    const url = buildAuthUrl();
    if (url) router.push(url);
  };

  const toggleWishlist = async () => {
    if (!isLoggedIn) {
      router.push(`/login?next=${encodeURIComponent(`/sale/${product.id}`)}`);
      return;
    }
    setWishLoading(true);
    if (wishlisted) {
      await supabase
        .from("wishlist_items")
        .delete()
        .eq("product_id", product.id);
      setWishlisted(false);
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("wishlist_items").insert({
          user_id: user.id,
          product_id: product.id,
        });
        setWishlisted(true);
      }
    }
    setWishLoading(false);
  };

  const setAddonSelected = (addonId: string, on: boolean, sizes: string[]) => {
    setAddonPicks((prev) => {
      const next = { ...prev };
      if (!on) {
        delete next[addonId];
      } else {
        next[addonId] = { productId: addonId, size: sizes[0] ?? "" };
      }
      return next;
    });
  };

  return (
    <div>
      <nav className="mb-6 text-[10px] text-muted">
        <Link href="/" className="hover:text-foreground">
          홈
        </Link>
        <span className="mx-1">/</span>
        <Link href="/sale" className="hover:text-foreground">
          Sale
        </Link>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        <div>
          {mainImage ? (
            <ProductImageZoom src={mainImage} alt={product.title} />
          ) : (
            <div className="flex aspect-[3/4] items-center justify-center bg-neutral-100 text-xs text-muted">
              No image
            </div>
          )}
          {images.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {images.map((url, idx) => (
                <button
                  key={url}
                  type="button"
                  onClick={() => setImageIndex(idx)}
                  className={`relative h-16 w-16 shrink-0 border ${
                    idx === imageIndex ? "border-foreground" : "border-border"
                  }`}
                >
                  <Image src={url} alt="" fill className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          {product.overseas_shipping && (
            <p className="text-[10px] text-muted">(해외배송 가능상품)</p>
          )}
          <h1 className="mt-1 text-2xl font-semibold leading-snug">{product.title}</h1>

          <table className="mt-6 w-full text-sm">
            <tbody>
              <tr className="border-b border-border">
                <th className="py-2 pr-4 text-left font-normal text-muted">판매가</th>
                <td className="py-2 font-medium">{formatKrw(product.price_krw)}</td>
              </tr>
              <tr className="border-b border-border">
                <th className="py-2 pr-4 text-left font-normal text-muted">배송비</th>
                <td className="py-2">
                  {formatShippingLabel(
                    product.shipping_fee_krw,
                    product.free_shipping_threshold_krw,
                  )}
                </td>
              </tr>
              <tr>
                <th className="py-2 pr-4 text-left font-normal text-muted">배송방법</th>
                <td className="py-2">택배</td>
              </tr>
            </tbody>
          </table>

          {needsSize && (
            <div className="mt-6">
              <div className="mb-2 flex items-center justify-between">
                <label className="text-[10px] uppercase tracking-widest text-muted">사이즈 *</label>
                {product.size_guide && (
                  <button
                    type="button"
                    onClick={() => setSizeGuideOpen(true)}
                    className="text-[10px] uppercase tracking-widest underline"
                  >
                    사이즈 가이드 &gt;
                  </button>
                )}
              </div>
              <select
                value={size}
                onChange={(e) => {
                  setSize(e.target.value);
                  const nextMax = Math.min(
                    MAX_QTY,
                    Math.max(getStockForSize(product.sizeStocks, e.target.value), 0),
                  );
                  if (quantity > nextMax) setQuantity(Math.max(1, nextMax));
                }}
                className="w-full border border-border px-4 py-3 text-sm outline-none focus:border-foreground"
              >
                <option value="">- [필수] 옵션을 선택해 주세요 -</option>
                {product.sizes.map((s) => {
                  const qty = getStockForSize(product.sizeStocks, s);
                  return (
                    <option key={s} value={s} disabled={qty <= 0}>
                      {s}
                      {qty <= 0 ? " (품절)" : ` (재고 ${qty})`}
                    </option>
                  );
                })}
              </select>
              <p className="mt-1 text-[10px] text-muted">
                (최소 1개 / 최대 {maxQty || 1}개)
              </p>
            </div>
          )}

          <div className="mt-4">
            <label className="mb-2 block text-[10px] uppercase tracking-widest text-muted">수량</label>
            <input
              type="number"
              min={1}
              max={Math.max(1, maxQty)}
              value={quantity}
              onChange={(e) =>
                setQuantity(
                  Math.min(Math.max(1, maxQty), Math.max(1, Number.parseInt(e.target.value, 10) || 1)),
                )
              }
              className="w-24 border border-border px-3 py-2 text-sm"
            />
            {maxQty > 0 && (
              <p className="mt-1 text-[10px] text-muted">남은 재고 {maxQty}개</p>
            )}
          </div>

          {product.addons.length > 0 && (
            <div className="mt-8 border-t border-border pt-6">
              <h2 className="text-sm font-medium">추가구성상품</h2>
              <p className="mt-1 text-[10px] text-muted">추가로 구매를 원하시면 선택하세요.</p>
              <ul className="mt-4 space-y-4">
                {product.addons.map(({ addon }) => {
                  const addonImages = getProductImages(addon);
                  const picked = addonPicks[addon.id];
                  return (
                    <li key={addon.id} className="flex gap-3 border border-border p-3">
                      <div className="relative h-16 w-16 shrink-0 bg-neutral-100">
                        {addonImages[0] && (
                          <Image src={addonImages[0]} alt="" fill className="object-cover" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{addon.title}</p>
                        <p className="text-xs text-muted">{formatKrw(addon.price_krw)}</p>
                        <label className="mt-2 flex items-center gap-2 text-xs">
                          <input
                            type="checkbox"
                            checked={!!picked}
                            onChange={(e) =>
                              setAddonSelected(addon.id, e.target.checked, addon.sizes)
                            }
                          />
                          추가하기
                        </label>
                        {picked && addon.sizes.length > 0 && (
                          <select
                            value={picked.size}
                            onChange={(e) =>
                              setAddonPicks((prev) => ({
                                ...prev,
                                [addon.id]: { productId: addon.id, size: e.target.value },
                              }))
                            }
                            className="mt-2 w-full border border-border px-2 py-1.5 text-xs"
                          >
                            <option value="">사이즈 선택</option>
                            {addon.sizes.map((s) => {
                              const qty = getStockForSize(addon.sizeStocks ?? {}, s);
                              return (
                                <option key={s} value={s} disabled={qty <= 0}>
                                  {s}
                                  {qty <= 0 ? " (품절)" : ` (재고 ${qty})`}
                                </option>
                              );
                            })}
                          </select>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          <div className="mt-8 border border-border bg-neutral-50 p-4">
            <p className="text-[10px] uppercase tracking-widest text-muted">선택 상품</p>
            <ul className="mt-2 space-y-1 text-sm">
              <li className="flex justify-between gap-2">
                <span className="truncate">
                  {product.title}
                  {size ? ` / ${size}` : ""} × {quantity}
                </span>
                <span className="shrink-0">{formatKrw(product.price_krw * quantity)}</span>
              </li>
              {selectedAddons.map((a) => (
                <li key={a.productId} className="flex justify-between gap-2 text-muted">
                  <span className="truncate">
                    + {a.title}
                    {a.size ? ` / ${a.size}` : ""}
                  </span>
                  <span className="shrink-0">{formatKrw(a.priceKrw)}</span>
                </li>
              ))}
              <li className="flex justify-between gap-2 border-t border-border pt-2 text-muted">
                <span>배송비</span>
                <span>{shippingKrw === 0 ? "무료" : formatKrw(shippingKrw)}</span>
              </li>
            </ul>
            <div className="mt-3 flex items-baseline justify-between border-t border-border pt-3">
              <span className="text-xs uppercase tracking-widest">Total</span>
              <span className="text-lg font-semibold">
                {formatKrw(totalKrw)}{" "}
                <span className="text-xs font-normal text-muted">({lineCount}개 품목)</span>
              </span>
            </div>
          </div>

          {message && <p className="mt-3 text-xs text-rose-500">{message}</p>}

          <div className="mt-6 grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              disabled={soldOut}
              onClick={handleBuyNow}
              className="bg-foreground py-3 text-xs uppercase tracking-widest text-background disabled:opacity-40"
            >
              {soldOut ? "Sold out" : "Buy it now"}
            </button>
            <button
              type="button"
              disabled={soldOut}
              onClick={addAllToCart}
              className="border border-border py-3 text-xs uppercase tracking-widest disabled:opacity-40"
            >
              Cart
            </button>
            <button
              type="button"
              onClick={toggleWishlist}
              disabled={wishLoading}
              className="border border-border py-3 text-xs uppercase tracking-widest sm:col-span-2"
            >
              {wishlisted ? "Wish list ✓" : "Wish list"}
            </button>
          </div>
        </div>
      </div>

      {product.description && (
        <div className="mt-16 border-t border-border pt-10">
          <h2 className="text-sm font-medium uppercase tracking-widest">Detail</h2>
          <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed">{product.description}</p>
        </div>
      )}

      {product.size_guide && (
        <SizeGuideModal
          open={sizeGuideOpen}
          onClose={() => setSizeGuideOpen(false)}
          guide={product.size_guide}
          title={product.title}
        />
      )}
    </div>
  );
}
