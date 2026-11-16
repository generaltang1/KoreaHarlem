"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ProductDetail } from "@/lib/productDetail";
import { buildCheckoutQuery } from "@/lib/productDetail";
import { getProductImages, isPurchasable, isSoldOut } from "@/lib/products";
import { getStockForSize } from "@/lib/stock";
import { calcShippingFee, formatShippingLabel } from "@/lib/shipping";
import { useCart } from "@/context/CartContext";
import { useCurrency } from "@/context/CurrencyContext";
import { createClient } from "@/lib/supabase/client";
import { ProductImageZoom } from "@/components/commerce/ProductImageZoom";
import { ProductPolicyNotice } from "@/components/commerce/ProductPolicyNotice";
import { ProductReviewsAndQna } from "@/components/commerce/ProductReviewsAndQna";
import { SizeGuideModal } from "@/components/commerce/SizeGuideModal";
import {
  TicketCancelRefund,
  TicketReceiveNotice,
} from "@/components/commerce/TicketCancelRefund";
import { TicketEventInfo } from "@/components/commerce/TicketEventInfo";
import { ProductCard } from "@/components/commerce/ProductCard";
import { parseTicketLineup, parseTicketPackages } from "@/lib/ticketMeta";
import { NaverMap } from "@/components/maps/NaverMap";
import { site } from "@/lib/siteTheme";
import type { ProductWithImages } from "@/lib/products";

interface AddonPick {
  productId: string;
  size: string;
}

type GoodsTab = "detail" | "size" | "shipping" | "qna";
type TicketTab = "event" | "lineup" | "map" | "refund";

interface ProductDetailClientProps {
  product: ProductDetail;
  initialWishlisted: boolean;
  isLoggedIn: boolean;
  isAdmin?: boolean;
  relatedProducts?: ProductWithImages[];
}

function QtyStepper({
  value,
  onChange,
  max,
}: {
  value: number;
  onChange: (n: number) => void;
  max?: number;
}) {
  return (
    <div className="inline-flex items-center overflow-hidden rounded-[8px] border border-[rgba(244,241,234,0.12)]">
      <button
        type="button"
        className="h-10 w-10 text-[#f4f1ea] hover:bg-[rgba(244,241,234,0.06)]"
        onClick={() => onChange(Math.max(1, value - 1))}
      >
        −
      </button>
      <span className="min-w-[2.5rem] text-center text-sm tabular-nums text-[#f4f1ea]">
        {value}
      </span>
      <button
        type="button"
        className="h-10 w-10 text-[#f4f1ea] hover:bg-[rgba(244,241,234,0.06)]"
        onClick={() =>
          onChange(max != null ? Math.min(max, value + 1) : Math.min(20, value + 1))
        }
      >
        +
      </button>
    </div>
  );
}

export function ProductDetailClient({
  product,
  initialWishlisted,
  isLoggedIn,
  isAdmin = false,
  relatedProducts = [],
}: ProductDetailClientProps) {
  const router = useRouter();
  const supabase = createClient();
  const images = getProductImages(product);
  const { formatKrw } = useCurrency();
  const { addItem } = useCart();

  const isTicket = product.category === "ticket";
  const ticketPackages = useMemo(
    () => parseTicketPackages(product.ticket_packages),
    [product.ticket_packages],
  );
  const hasTicketPackages = ticketPackages.length > 0;
  const lineupRows = useMemo(() => parseTicketLineup(product.lineup), [product.lineup]);
  const hasCoords =
    typeof product.venue_lat === "number" &&
    typeof product.venue_lng === "number" &&
    Number.isFinite(product.venue_lat) &&
    Number.isFinite(product.venue_lng);

  const [imageIndex, setImageIndex] = useState(0);
  const [size, setSize] = useState(product.sizes[0] ?? "");
  const [selectedPackageId, setSelectedPackageId] = useState(
    () => ticketPackages[0]?.id ?? "",
  );
  const [quantity, setQuantity] = useState(1);
  const [addonPicks, setAddonPicks] = useState<Record<string, AddonPick>>({});
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [wishlisted, setWishlisted] = useState(initialWishlisted);
  const [wishLoading, setWishLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [goodsTab, setGoodsTab] = useState<GoodsTab>("detail");
  const [ticketTab, setTicketTab] = useState<TicketTab>("event");

  const selectedPackage = ticketPackages.find((p) => p.id === selectedPackageId) ?? null;
  const unitPriceKrw = selectedPackage?.price_krw ?? product.price_krw;

  const soldOut = isSoldOut({ ...product, sizeStocks: product.sizeStocks });
  const showStock = product.show_stock !== false;
  const purchasable = isPurchasable(product);
  const needsSize = !isTicket && product.sizes.length > 0;
  const mainImage = images[imageIndex] ?? images[0];

  const availableForSize = getStockForSize(product.sizeStocks, needsSize ? size : "");
  const maxQty = isTicket ? 20 : Math.max(availableForSize, 0);

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
    const main = unitPriceKrw * quantity;
    const addons = selectedAddons.reduce((sum, a) => sum + a.priceKrw, 0);
    return main + addons;
  }, [unitPriceKrw, quantity, selectedAddons]);

  const shippingKrw = useMemo(
    () =>
      isTicket
        ? 0
        : calcShippingFee(
            merchandiseKrw,
            product.shipping_fee_krw,
            product.free_shipping_threshold_krw,
          ),
    [isTicket, merchandiseKrw, product.shipping_fee_krw, product.free_shipping_threshold_krw],
  );

  const totalKrw = merchandiseKrw + shippingKrw;

  const eventWhen = useMemo(() => {
    if (!product.event_starts_at && !product.event_ends_at) return null;
    const fmt = (iso: string) =>
      new Date(iso).toLocaleString("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    if (product.event_starts_at && product.event_ends_at) {
      return `${fmt(product.event_starts_at)} – ${fmt(product.event_ends_at)}`;
    }
    return fmt((product.event_starts_at || product.event_ends_at)!);
  }, [product.event_starts_at, product.event_ends_at]);

  const validate = () => {
    if (!purchasable) return "현재 판매 중인 상품이 아닙니다.";
    if (soldOut) return "품절된 상품입니다.";
    if (isTicket && hasTicketPackages && !selectedPackage) {
      return "티켓 패키지를 선택해주세요.";
    }
    if (needsSize && !size) return "사이즈를 선택해주세요.";
    if (needsSize && getStockForSize(product.sizeStocks, size) <= 0) {
      return "선택한 사이즈는 품절입니다.";
    }
    if (!isTicket && !needsSize && availableForSize <= 0) return "품절된 상품입니다.";
    if (!isTicket && quantity > maxQty) {
      return showStock
        ? `최대 ${maxQty}개까지 주문할 수 있습니다.`
        : "주문 가능 수량을 초과했습니다.";
    }
    for (const { addon } of product.addons) {
      const pick = addonPicks[addon.id];
      if (!pick) continue;
      if (addon.sizes.length > 0 && !pick.size) {
        return `"${addon.title}" 사이즈를 선택해주세요.`;
      }
      const addonStock = getStockForSize(addon.sizeStocks ?? {}, pick.size);
      if (addonStock <= 0) return `"${addon.title}" 선택 옵션은 품절입니다.`;
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
    const cartSize = isTicket
      ? selectedPackage
        ? `pkg:${selectedPackage.id}`
        : null
      : size || null;
    const cartTitle =
      isTicket && selectedPackage
        ? `${product.title} · ${selectedPackage.name}`
        : product.title;
    addItem({
      productId: product.id,
      title: cartTitle,
      imageUrl: images[0],
      size: cartSize,
      priceKrw: unitPriceKrw,
      quantity,
      kind: isTicket ? "ticket" : "product",
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

  const handleBuyNow = () => {
    const err = validate();
    if (err) {
      setMessage(err);
      return;
    }
    const q = buildCheckoutQuery({
      buy: product.id,
      size: isTicket
        ? selectedPackage
          ? `pkg:${selectedPackage.id}`
          : undefined
        : size || undefined,
      qty: quantity,
      addons: isTicket ? [] : selectedAddons,
    });
    router.push(`/checkout/auth?${q}`);
  };

  const toggleWishlist = async () => {
    if (!isLoggedIn) {
      router.push(`/login?next=${encodeURIComponent(`/sale/${product.id}`)}`);
      return;
    }
    setWishLoading(true);
    if (wishlisted) {
      await supabase.from("wishlist_items").delete().eq("product_id", product.id);
      setWishlisted(false);
    } else {
      const {
        data: { user },
      } = await supabase.auth.getUser();
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
      if (!on) delete next[addonId];
      else next[addonId] = { productId: addonId, size: sizes[0] ?? "" };
      return next;
    });
  };

  const selectSize = (s: string) => {
    setSize(s);
    const nextMax = Math.max(getStockForSize(product.sizeStocks, s), 0);
    if (quantity > nextMax) setQuantity(Math.max(1, nextMax));
  };

  const goodsTabs: { id: GoodsTab; label: string }[] = [
    { id: "detail", label: "상세 정보" },
    { id: "size", label: "사이즈 가이드" },
    { id: "shipping", label: "배송/교환/반품" },
    { id: "qna", label: "상품 문의" },
  ];

  const ticketTabs: { id: TicketTab; label: string }[] = [
    { id: "event", label: "이벤트 정보" },
    { id: "lineup", label: "라인업" },
    { id: "map", label: "장소 · 지도" },
    { id: "refund", label: "취소 · 환불" },
  ];

  return (
    <div className={`text-[#f4f1ea] ${site.font}`}>
      <nav className="mb-6 text-[10px] text-[#a8a49b]">
        <Link href="/" className="hover:text-[#f4f1ea]">
          홈
        </Link>
        <span className="mx-1">/</span>
        <Link href="/sale" className="hover:text-[#f4f1ea]">
          STORE
        </Link>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        <div>
          {mainImage ? (
            <div className="overflow-hidden rounded-[8px] border border-[rgba(244,241,234,0.12)]">
              <ProductImageZoom
                key={mainImage}
                src={mainImage}
                alt={product.title}
              />
            </div>
          ) : (
            <div className="flex aspect-[3/4] items-center justify-center rounded-[8px] border border-[rgba(244,241,234,0.12)] bg-[#151515] text-xs text-[#6e6b65]">
              No image
            </div>
          )}
          {images.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {images.map((url, idx) => (
                <button
                  key={`${idx}-${url}`}
                  type="button"
                  onClick={() => setImageIndex(idx)}
                  aria-label={`이미지 ${idx + 1} 보기`}
                  aria-pressed={idx === imageIndex}
                  className={`relative h-16 w-16 shrink-0 overflow-hidden rounded border ${
                    idx === imageIndex
                      ? "border-[#f4f1ea]"
                      : "border-[rgba(244,241,234,0.12)]"
                  }`}
                >
                  <Image src={url} alt="" fill className="object-cover" sizes="64px" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          {product.overseas_shipping && !isTicket && (
            <p className="text-[10px] text-[#a8a49b]">(해외배송 가능상품)</p>
          )}
          <h1 className="mt-1 text-2xl font-bold leading-snug tracking-tight sm:text-3xl">
            {product.title}
          </h1>
          {product.title_en?.trim() && (
            <p className="mt-1 text-sm text-[#a8a49b]">{product.title_en.trim()}</p>
          )}

          {isTicket ? (
            <dl className="mt-6 space-y-2 text-sm">
              {eventWhen && (
                <div className="flex gap-3">
                  <dt className="w-20 shrink-0 text-[#FEE500]">일시</dt>
                  <dd className="text-[#f4f1ea]">{eventWhen}</dd>
                </div>
              )}
              {(product.venue || product.venue_address) && (
                <div className="flex gap-3">
                  <dt className="w-20 shrink-0 text-[#FEE500]">장소</dt>
                  <dd className="text-[#f4f1ea]">
                    {product.venue || product.venue_address}
                  </dd>
                </div>
              )}
              <div className="flex gap-3">
                <dt className="w-20 shrink-0 text-[#FEE500]">연령</dt>
                <dd className="text-[#f4f1ea]">
                  {product.minors_allowed
                    ? "전 연령 관람 가능"
                    : "19세 이상 (미성년자 출입 금지)"}
                </dd>
              </div>
            </dl>
          ) : null}

          <p className="mt-6 text-2xl font-semibold">{formatKrw(unitPriceKrw)}</p>

          {!isTicket && (
            <p className="mt-2 text-xs text-[#a8a49b]">
              배송비{" "}
              {formatShippingLabel(
                product.shipping_fee_krw,
                product.free_shipping_threshold_krw,
              )}
            </p>
          )}

          {isTicket && hasTicketPackages && (
            <div className="mt-6 space-y-2">
              <p className="text-[11px] tracking-wide text-[#a8a49b]">패키지 선택</p>
              <ul className="space-y-2">
                {ticketPackages.map((pkg) => {
                  const selected = pkg.id === selectedPackageId;
                  return (
                    <li key={pkg.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedPackageId(pkg.id)}
                        className={`flex w-full items-start justify-between gap-3 rounded-[8px] border px-4 py-3 text-left transition ${
                          selected
                            ? "border-[#FEE500] bg-[rgba(254,229,0,0.06)]"
                            : "border-[rgba(244,241,234,0.12)] hover:border-[rgba(244,241,234,0.28)]"
                        }`}
                      >
                        <span>
                          <span className="block text-sm font-medium">{pkg.name}</span>
                          {pkg.description ? (
                            <span className="mt-0.5 block text-xs text-[#FEE500]/80">
                              {pkg.description}
                            </span>
                          ) : null}
                        </span>
                        <span className="shrink-0 text-sm">{formatKrw(pkg.price_krw)}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {needsSize && (
            <div className="mt-6">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[11px] tracking-wide text-[#a8a49b]">사이즈</p>
                {product.size_guide && (
                  <button
                    type="button"
                    onClick={() => setSizeGuideOpen(true)}
                    className="text-[11px] text-[#FEE500] underline-offset-2 hover:underline"
                  >
                    사이즈 가이드
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((s) => {
                  const qty = getStockForSize(product.sizeStocks, s);
                  const out = qty <= 0;
                  const selected = size === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      disabled={out}
                      onClick={() => !out && selectSize(s)}
                      className={`min-w-14 rounded-[8px] border px-3 py-2.5 text-xs transition ${
                        out
                          ? "cursor-not-allowed border-[rgba(244,241,234,0.08)] text-[#6e6b65] line-through"
                          : selected
                            ? "border-[#f4f1ea] bg-[#f4f1ea] font-semibold text-[#0a0a0a]"
                            : "border-[rgba(244,241,234,0.12)] text-[#f4f1ea] hover:bg-[rgba(244,241,234,0.06)]"
                      }`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
              {showStock && size && (
                <p className="mt-2 text-[11px] text-[#6e6b65]">
                  남은 재고 {availableForSize}개
                </p>
              )}
            </div>
          )}

          <div className="mt-5">
            <p className="mb-2 text-[11px] tracking-wide text-[#a8a49b]">
              {isTicket ? "매수" : "수량"}
            </p>
            <QtyStepper
              value={quantity}
              max={isTicket ? 20 : Math.max(1, maxQty)}
              onChange={setQuantity}
            />
          </div>

          {!isTicket && product.addons.length > 0 && (
            <div className="mt-8 space-y-3 border-t border-[rgba(244,241,234,0.12)] pt-6">
              <h2 className="text-sm font-medium">추가구성상품</h2>
              <ul className="space-y-3">
                {product.addons.map(({ addon }) => {
                  const addonImages = getProductImages(addon);
                  const picked = addonPicks[addon.id];
                  return (
                    <li
                      key={addon.id}
                      className="flex gap-3 rounded-[8px] border border-[rgba(244,241,234,0.12)] p-3"
                    >
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded bg-[#151515]">
                        {addonImages[0] && (
                          <Image
                            src={addonImages[0]}
                            alt=""
                            fill
                            className="object-cover"
                          />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{addon.title}</p>
                        <p className="text-xs text-[#a8a49b]">
                          {formatKrw(addon.price_krw)}
                        </p>
                        <label className="mt-2 flex items-center gap-2 text-xs text-[#a8a49b]">
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
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {addon.sizes.map((s) => {
                              const qty = getStockForSize(addon.sizeStocks ?? {}, s);
                              const out = qty <= 0;
                              const selected = picked.size === s;
                              return (
                                <button
                                  key={s}
                                  type="button"
                                  disabled={out}
                                  onClick={() =>
                                    setAddonPicks((prev) => ({
                                      ...prev,
                                      [addon.id]: {
                                        productId: addon.id,
                                        size: s,
                                      },
                                    }))
                                  }
                                  className={`rounded-[6px] border px-2 py-1 text-[10px] ${
                                    out
                                      ? "border-[rgba(244,241,234,0.08)] text-[#6e6b65] line-through"
                                      : selected
                                        ? "border-[#f4f1ea] bg-[#f4f1ea] text-[#0a0a0a]"
                                        : "border-[rgba(244,241,234,0.12)] text-[#f4f1ea]"
                                  }`}
                                >
                                  {s}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          <div className="mt-8 rounded-[8px] border border-[rgba(244,241,234,0.12)] bg-[rgba(244,241,234,0.05)] p-4">
            <div className="flex justify-between gap-2 text-sm">
              <span className="truncate text-[#a8a49b]">
                {isTicket
                  ? `${selectedPackage?.name ?? "입장권"} × ${quantity}`
                  : `${size || "옵션"} × ${quantity}`}
              </span>
              <span className="shrink-0 font-medium">
                {formatKrw(unitPriceKrw * quantity)}
              </span>
            </div>
            {!isTicket &&
              selectedAddons.map((a) => (
                <div
                  key={a.productId}
                  className="mt-2 flex justify-between gap-2 text-sm text-[#a8a49b]"
                >
                  <span className="truncate">
                    + {a.title}
                    {a.size ? ` / ${a.size}` : ""}
                  </span>
                  <span className="shrink-0">{formatKrw(a.priceKrw)}</span>
                </div>
              ))}
            <div className="mt-3 flex items-baseline justify-between border-t border-[rgba(244,241,234,0.12)] pt-3">
              <span className="text-xs uppercase tracking-widest text-[#a8a49b]">
                Total
              </span>
              <span className="text-xl font-semibold">{formatKrw(totalKrw)}</span>
            </div>
          </div>

          {isTicket && <TicketReceiveNotice className="mt-4" />}

          {message && <p className="mt-3 text-xs text-rose-400">{message}</p>}

          {!purchasable && (
            <p className="mt-3 rounded-[8px] border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-xs text-amber-200">
              이 상품은 진열 중이며, 판매는 아직 시작되지 않았습니다.
            </p>
          )}

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              disabled={!purchasable || soldOut}
              onClick={addAllToCart}
              className={`${site.ghostBtn} disabled:opacity-40`}
            >
              {!purchasable ? "판매 준비 중" : soldOut ? "Sold out" : "+ 장바구니 담기"}
            </button>
            <button
              type="button"
              disabled={!purchasable || soldOut}
              onClick={handleBuyNow}
              className={`${site.creamBtn} disabled:opacity-40`}
            >
              {!purchasable
                ? "판매 준비 중"
                : soldOut
                  ? "Sold out"
                  : isTicket
                    ? "바로 예매"
                    : "바로 구매"}
            </button>
            {!isTicket && (
              <button
                type="button"
                onClick={toggleWishlist}
                disabled={wishLoading}
                className={`${site.ghostBtn} sm:col-span-2`}
              >
                {wishlisted ? "Wish list ✓" : "Wish list"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Lower tabs */}
      {isTicket ? (
        <div className="mt-14">
          <div className="flex gap-1 overflow-x-auto border-b border-[rgba(244,241,234,0.12)]">
            {ticketTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setTicketTab(tab.id)}
                className={`shrink-0 px-4 py-3 text-xs tracking-wide transition ${
                  ticketTab === tab.id
                    ? "border-b-2 border-[#FEE500] font-semibold text-[#FEE500]"
                    : "text-[#a8a49b] hover:text-[#f4f1ea]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="mt-8">
            {ticketTab === "event" && (
              <TicketEventInfo
                eventStartsAt={product.event_starts_at}
                eventEndsAt={product.event_ends_at}
                venue={product.venue}
                venueLat={product.venue_lat}
                venueLng={product.venue_lng}
                venueAddress={product.venue_address}
                minorsAllowed={product.minors_allowed}
                lineup={[]}
                showMap={false}
              />
            )}
            {ticketTab === "lineup" && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-[#FEE500]">라인업</h3>
                {lineupRows.length === 0 ? (
                  <p className="text-sm text-[#a8a49b]">등록된 라인업이 없습니다.</p>
                ) : (
                  <TicketEventInfo
                    lineup={product.lineup}
                    showMap={false}
                  />
                )}
              </div>
            )}
            {ticketTab === "map" && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-[#FEE500]">장소</h3>
                <p className="text-sm text-[#f4f1ea]">
                  {product.venue || product.venue_address || "장소 미등록"}
                </p>
                {product.venue_address && product.venue ? (
                  <p className="text-xs text-[#a8a49b]">{product.venue_address}</p>
                ) : null}
                {hasCoords ? (
                  <NaverMap lat={product.venue_lat!} lng={product.venue_lng!} />
                ) : (
                  <div className="flex h-[280px] items-center justify-center rounded-[8px] border border-[rgba(244,241,234,0.12)] bg-[rgba(244,241,234,0.05)] text-xs text-[#a8a49b]">
                    지도 좌표가 등록되지 않았습니다.
                  </div>
                )}
              </div>
            )}
            {ticketTab === "refund" && <TicketCancelRefund />}
          </div>
        </div>
      ) : (
        <div className="mt-14">
          <div className="flex gap-1 overflow-x-auto border-b border-[rgba(244,241,234,0.12)]">
            {goodsTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setGoodsTab(tab.id)}
                className={`shrink-0 px-4 py-3 text-xs tracking-wide transition ${
                  goodsTab === tab.id
                    ? "border-b-2 border-[#FEE500] font-semibold text-[#FEE500]"
                    : "text-[#a8a49b] hover:text-[#f4f1ea]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="mt-8">
            {goodsTab === "detail" && (
              <div>
                <h3 className="mb-4 text-sm font-semibold text-[#FEE500]">상세 정보</h3>
                {product.description ? (
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#a8a49b]">
                    {product.description}
                  </p>
                ) : (
                  <p className="text-sm text-[#6e6b65]">등록된 상세 설명이 없습니다.</p>
                )}
              </div>
            )}
            {goodsTab === "size" && (
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-[#FEE500]">사이즈 가이드</h3>
                  {product.size_guide && (
                    <button
                      type="button"
                      onClick={() => setSizeGuideOpen(true)}
                      className="text-xs text-[#f4f1ea] underline underline-offset-2"
                    >
                      크게 보기
                    </button>
                  )}
                </div>
                {product.size_guide ? (
                  <div className="overflow-x-auto rounded-[8px] border border-[rgba(244,241,234,0.12)]">
                    <table className="w-full border-collapse text-sm text-[#f4f1ea]">
                      <tbody>
                        {product.size_guide.rows.map((row, i) => (
                          <tr
                            key={i}
                            className={
                              i === 0
                                ? "bg-[rgba(244,241,234,0.08)] font-medium"
                                : "border-t border-[rgba(244,241,234,0.12)]"
                            }
                          >
                            {row.map((cell, j) => (
                              <td key={j} className="px-3 py-2.5 text-center">
                                {cell || "—"}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-[#6e6b65]">
                    등록된 사이즈 가이드가 없습니다. Admin에서 상품 수정 시 사이즈 가이드를
                    추가할 수 있습니다.
                  </p>
                )}
              </div>
            )}
            {goodsTab === "shipping" && <ProductPolicyNotice className="!mt-0 !border-0 !pt-0" />}
            {goodsTab === "qna" && (
              <ProductReviewsAndQna
                productId={product.id}
                isLoggedIn={isLoggedIn}
                isAdmin={isAdmin}
              />
            )}
          </div>
        </div>
      )}

      {relatedProducts.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-6 text-lg font-semibold">이런 상품은 어때요</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
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
