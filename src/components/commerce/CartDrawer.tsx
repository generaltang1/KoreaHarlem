"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo } from "react";
import { useCart, type CartLine } from "@/context/CartContext";
import { useCurrency } from "@/context/CurrencyContext";
import { formatMinorAmount, convertKrwToMinor } from "@/lib/currency";
import { isProductPurchasable } from "@/lib/cartAvailability";
import { useCartProductAvailability } from "@/hooks/useCartProductAvailability";
import { calcShippingFee } from "@/lib/shipping";

/** 시안 기준 기본값 — 상품별 설정이 장바구니에 없을 때 */
const DEFAULT_SHIPPING_FEE_KRW = 4000;
const DEFAULT_FREE_THRESHOLD_KRW = 50000;

function lineCategoryLabel(item: CartLine) {
  if (item.kind === "digital_album") return "디지털 앨범";
  if (item.kind === "digital_track") return "디지털 음원";
  return "상품";
}

function lineOptionLabel(item: CartLine) {
  if (item.kind === "digital_album" || item.kind === "digital_track") {
    return item.kind === "digital_album" ? "디지털 앨범 · 1개" : "디지털 음원 · 1개";
  }
  const sizePart = item.size ? `사이즈 ${item.size}` : "옵션 없음";
  return `${sizePart} · ${item.quantity}개`;
}

export function CartDrawer() {
  const {
    items,
    isOpen,
    closeCart,
    removeItem,
    updateQuantity,
    subtotalMinor,
    itemCount,
  } = useCart();
  const { currency, formatKrw } = useCurrency();

  const productIds = useMemo(
    () => items.filter((item) => (item.kind ?? "product") === "product").map((item) => item.productId),
    [items],
  );
  const { availability, loading: availabilityLoading } = useCartProductAvailability(productIds, isOpen);

  const physicalSubtotalKrw = useMemo(
    () =>
      items
        .filter((i) => (i.kind ?? "product") === "product")
        .reduce((sum, i) => sum + i.priceKrw * i.quantity, 0),
    [items],
  );

  const hasPhysical = physicalSubtotalKrw > 0;
  const shippingKrw = hasPhysical
    ? calcShippingFee(physicalSubtotalKrw, DEFAULT_SHIPPING_FEE_KRW, DEFAULT_FREE_THRESHOLD_KRW)
    : 0;
  const shippingMinor = convertKrwToMinor(shippingKrw, currency);
  const totalMinor = subtotalMinor + shippingMinor;
  const freeProgress = hasPhysical
    ? Math.min(1, physicalSubtotalKrw / DEFAULT_FREE_THRESHOLD_KRW)
    : 0;
  const freeApplied = hasPhysical && shippingKrw === 0;
  const remainingToFree = Math.max(0, DEFAULT_FREE_THRESHOLD_KRW - physicalSubtotalKrw);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80]">
      <button
        type="button"
        className="absolute inset-0 bg-black/60"
        aria-label="장바구니 닫기"
        onClick={closeCart}
      />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-[440px] flex-col border-l border-[rgba(244,241,234,0.12)] bg-[#141414]/90 text-[#f4f1ea] shadow-[0_0_60px_rgba(0,0,0,0.55)] backdrop-blur-[10px] [font-family:var(--font-f-sans),var(--font-geist-sans),sans-serif]">
        <div className="flex items-center justify-between px-6 py-5">
          <h2 className="flex items-baseline gap-2 text-xl font-bold tracking-tight">
            장바구니
            <span className="text-sm font-semibold text-[#FEE500]">{itemCount}</span>
          </h2>
          <button
            type="button"
            onClick={closeCart}
            className="flex h-8 w-8 items-center justify-center rounded-[8px] text-[#a8a49b] transition-colors hover:bg-[rgba(244,241,234,0.06)] hover:text-[#f4f1ea]"
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        {hasPhysical && (
          <div className="border-b border-[rgba(244,241,234,0.12)] px-6 pb-4">
            <p className="text-xs leading-relaxed text-[#FEE500]">
              {freeApplied
                ? `무료배송 적용됐어요 · 배송 상품 ${formatKrw(physicalSubtotalKrw)} (${formatKrw(DEFAULT_FREE_THRESHOLD_KRW)} 이상 무료)`
                : `무료배송까지 ${formatKrw(remainingToFree)} 남았어요 · 배송 상품 ${formatKrw(physicalSubtotalKrw)}`}
            </p>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-[rgba(244,241,234,0.12)]">
              <div
                className="h-full rounded-full bg-[#FEE500] transition-all"
                style={{ width: `${Math.round(freeProgress * 100)}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <p className="px-6 py-16 text-center text-sm text-neutral-500">장바구니가 비어 있습니다.</p>
          ) : (
            <ul>
              {items.map((item) => {
                const digital = item.kind === "digital_album" || item.kind === "digital_track";
                const purchasable = digital || isProductPurchasable(availability.get(item.productId));
                const showUnavailable = !availabilityLoading && !purchasable;
                const lineMinor = item.unitPriceMinor * item.quantity;
                return (
                  <li
                    key={item.key}
                    className={`relative flex gap-4 border-b border-[rgba(244,241,234,0.12)] px-6 py-5 ${
                      showUnavailable ? "opacity-50" : ""
                    }`}
                  >
                    <div className="relative h-24 w-[72px] shrink-0 overflow-hidden rounded-[8px] bg-[rgba(244,241,234,0.05)]">
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.title}
                          fill
                          className={`object-cover ${showUnavailable ? "grayscale" : ""}`}
                        />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1 pr-6">
                      <p className="text-[10px] font-medium tracking-wide text-[#FEE500]">
                        {lineCategoryLabel(item)}
                      </p>
                      <p className="mt-1 truncate text-sm font-semibold text-[#f4f1ea]">{item.title}</p>
                      {showUnavailable && (
                        <span className="mt-1 inline-block text-[10px] text-rose-400">구매 불가</span>
                      )}
                      <p className="mt-1 text-xs text-[#a8a49b]">{lineOptionLabel(item)}</p>
                      <div className="mt-3 flex items-center gap-3">
                        {!digital ? (
                          <div className="inline-flex items-center overflow-hidden rounded-[8px] border border-[rgba(244,241,234,0.12)] bg-[rgba(244,241,234,0.05)]">
                            <button
                              type="button"
                              className="flex h-7 w-7 items-center justify-center text-sm text-[#a8a49b] hover:text-[#f4f1ea]"
                              onClick={() => updateQuantity(item.key, item.quantity - 1)}
                              aria-label="수량 감소"
                            >
                              −
                            </button>
                            <span className="w-6 text-center text-xs tabular-nums">{item.quantity}</span>
                            <button
                              type="button"
                              className="flex h-7 w-7 items-center justify-center text-sm text-[#a8a49b] hover:text-[#f4f1ea]"
                              onClick={() => updateQuantity(item.key, item.quantity + 1)}
                              aria-label="수량 증가"
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-[#a8a49b]">수량 1</span>
                        )}
                        <span className="text-sm font-medium tabular-nums">
                          {formatMinorAmount(lineMinor, currency)}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="absolute right-5 top-5 flex h-6 w-6 items-center justify-center rounded-[6px] text-[#6e6b65] transition-colors hover:bg-[rgba(244,241,234,0.06)] hover:text-[#f4f1ea]"
                      onClick={() => removeItem(item.key)}
                      aria-label="삭제"
                    >
                      ✕
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="border-t border-[rgba(244,241,234,0.12)] px-6 py-5">
          <div className="flex items-center justify-between text-sm text-[#a8a49b]">
            <span>상품 금액</span>
            <span className="tabular-nums text-[#f4f1ea]">
              {formatMinorAmount(subtotalMinor, currency)}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-sm text-[#a8a49b]">
            <span>배송비</span>
            <span className={`tabular-nums ${shippingKrw === 0 ? "text-[#FEE500]" : "text-[#f4f1ea]"}`}>
              {hasPhysical
                ? shippingKrw === 0
                  ? formatMinorAmount(0, currency)
                  : formatMinorAmount(shippingMinor, currency)
                : "—"}
            </span>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-[rgba(244,241,234,0.12)] pt-4">
            <span className="text-sm font-medium">결제 예정 금액</span>
            <span className="text-xl font-bold tabular-nums">
              {formatMinorAmount(totalMinor, currency)}
            </span>
          </div>
          <p className="mt-2 text-[10px] leading-relaxed text-[#6e6b65]">
            표시된 금액으로 결제됩니다. 통화 변경 시 기준가(KRW)에서 다시 환산됩니다.
          </p>
          <Link
            href="/checkout/auth"
            onClick={closeCart}
            className={`mt-4 flex w-full items-center justify-center rounded-[8px] bg-[#f4f1ea] py-3.5 text-sm font-semibold text-[#0a0a0a] transition-opacity hover:opacity-90 ${
              items.length === 0 ? "pointer-events-none opacity-40" : ""
            }`}
          >
            주문하기
          </Link>
          <Link
            href="/cart"
            onClick={closeCart}
            className="mt-3 flex w-full items-center justify-center rounded-[8px] border border-[rgba(244,241,234,0.12)] py-3 text-sm text-[#f4f1ea] transition-colors hover:bg-[rgba(244,241,234,0.06)]"
          >
            장바구니 전체 보기
          </Link>
        </div>
      </aside>
    </div>
  );
}
