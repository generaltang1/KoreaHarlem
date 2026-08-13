"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo } from "react";
import { useCart } from "@/context/CartContext";
import { useCurrency } from "@/context/CurrencyContext";
import { formatMinorAmount } from "@/lib/currency";
import { isProductPurchasable } from "@/lib/cartAvailability";
import { useCartProductAvailability } from "@/hooks/useCartProductAvailability";

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
  const { currency } = useCurrency();

  const productIds = useMemo(() => items.map((item) => item.productId), [items]);
  const { availability, loading: availabilityLoading } = useCartProductAvailability(productIds, isOpen);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80]">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="장바구니 닫기"
        onClick={closeCart}
      />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-background shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-sm font-medium uppercase tracking-widest">
            Cart ({itemCount})
          </h2>
          <button
            type="button"
            onClick={closeCart}
            className="text-xs uppercase tracking-widest text-muted hover:text-foreground"
          >
            Close
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted">장바구니가 비어 있습니다.</p>
          ) : (
            <ul className="space-y-5">
              {items.map((item) => {
                const purchasable = isProductPurchasable(availability.get(item.productId));
                const showUnavailable = !availabilityLoading && !purchasable;
                return (
                <li
                  key={item.key}
                  className={`flex gap-3 ${showUnavailable ? "opacity-50" : ""}`}
                >
                  <div className="relative h-20 w-16 shrink-0 overflow-hidden bg-neutral-100">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.title}
                        fill
                        className={`object-cover ${showUnavailable ? "grayscale" : ""}`}
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-medium">{item.title}</p>
                      {showUnavailable && (
                        <span className="shrink-0 border border-neutral-300 bg-neutral-100 px-1.5 py-0.5 text-[10px] uppercase tracking-widest text-neutral-600">
                          구매 불가
                        </span>
                      )}
                    </div>
                    {item.size && <p className="mt-0.5 text-xs text-muted">Size {item.size}</p>}
                    <p className="mt-1 text-sm">
                      {formatMinorAmount(item.unitPriceMinor, currency)}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        type="button"
                        className="h-7 w-7 border border-border text-xs"
                        onClick={() => updateQuantity(item.key, item.quantity - 1)}
                      >
                        −
                      </button>
                      <span className="w-6 text-center text-xs">{item.quantity}</span>
                      <button
                        type="button"
                        className="h-7 w-7 border border-border text-xs"
                        onClick={() => updateQuantity(item.key, item.quantity + 1)}
                      >
                        +
                      </button>
                      <button
                        type="button"
                        className="ml-auto text-[10px] uppercase tracking-widest text-rose-500"
                        onClick={() => removeItem(item.key)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="border-t border-border px-5 py-4">
          <div className="mb-4 flex items-center justify-between text-sm">
            <span className="text-muted">Subtotal</span>
            <span className="font-medium">
              {formatMinorAmount(subtotalMinor, currency)} {currency.code}
            </span>
          </div>
          <p className="mb-3 text-[10px] leading-relaxed text-muted">
            표시된 금액으로 결제됩니다. 통화 변경 시 장바구니 금액이 기준가(KRW)에서 다시 환산됩니다.
          </p>
          <Link
            href="/checkout"
            onClick={closeCart}
            className={`block w-full bg-foreground py-3 text-center text-xs uppercase tracking-widest text-background ${
              items.length === 0 ? "pointer-events-none opacity-40" : ""
            }`}
          >
            Check out
          </Link>
        </div>
      </aside>
    </div>
  );
}
