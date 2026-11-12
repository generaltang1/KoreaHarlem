"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CommerceAtmosphere } from "@/components/mypage/CommerceAtmosphere";
import { useCart, type CartLine } from "@/context/CartContext";
import { useCurrency } from "@/context/CurrencyContext";
import { formatMinorAmount, convertKrwToMinor } from "@/lib/currency";
import { calcShippingFee } from "@/lib/shipping";
import { mp } from "@/lib/mypageTheme";

const DEFAULT_SHIPPING_FEE_KRW = 4000;
const DEFAULT_FREE_THRESHOLD_KRW = 50000;

function lineOptionLabel(item: CartLine) {
  if (item.kind === "digital_album" || item.kind === "digital_track") {
    return item.kind === "digital_album" ? "디지털 앨범 · 1개" : "디지털 음원 · 1개";
  }
  const sizePart = item.size ? `사이즈 ${item.size}` : "옵션 없음";
  return `${sizePart} · ${item.quantity}개`;
}

export default function CartPage() {
  const { items, removeItem, updateQuantity, subtotalMinor, itemCount } = useCart();
  const { currency, formatKrw } = useCurrency();

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
  const totalMinor = subtotalMinor + convertKrwToMinor(shippingKrw, currency);

  return (
    <>
      <Header />
      <CommerceAtmosphere className="px-4 py-12 sm:px-8">
        <div className="mx-auto max-w-3xl">
          <h1 className="flex items-baseline gap-2 text-2xl font-bold">
            장바구니
            <span className="text-base text-[#FEE500]">{itemCount}</span>
          </h1>

          {items.length === 0 ? (
            <div className={`${mp.card} mt-12 px-6 py-16 text-center`}>
              <p className="text-sm text-neutral-400">장바구니가 비어 있습니다.</p>
              <Link href="/sale" className={`mt-6 ${mp.creamBtn}`}>
                쇼핑하러 가기
              </Link>
            </div>
          ) : (
            <>
              <ul className={`${mp.card} mt-8 divide-y divide-white/10`}>
                {items.map((item) => {
                  const digital =
                    item.kind === "digital_album" || item.kind === "digital_track";
                  return (
                    <li
                      key={item.key}
                      className="flex gap-4 border-b border-[#262626] px-5 py-5 last:border-b-0"
                    >
                      <div className="relative h-24 w-[72px] shrink-0 overflow-hidden bg-[#0c0c0c]">
                        {item.imageUrl ? (
                          <Image src={item.imageUrl} alt={item.title} fill className="object-cover" />
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{item.title}</p>
                        <p className="mt-1 text-xs text-neutral-500">{lineOptionLabel(item)}</p>
                        <div className="mt-3 flex flex-wrap items-center gap-3">
                          {!digital && (
                            <div className="inline-flex items-center border border-[#333]">
                              <button
                                type="button"
                                className="h-7 w-7"
                                onClick={() => updateQuantity(item.key, item.quantity - 1)}
                              >
                                −
                              </button>
                              <span className="w-6 text-center text-xs">{item.quantity}</span>
                              <button
                                type="button"
                                className="h-7 w-7"
                                onClick={() => updateQuantity(item.key, item.quantity + 1)}
                              >
                                +
                              </button>
                            </div>
                          )}
                          <span className="text-sm">
                            {formatMinorAmount(item.unitPriceMinor * item.quantity, currency)}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeItem(item.key)}
                            className="ml-auto text-xs text-neutral-500 hover:text-white"
                          >
                            삭제
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>

              <div className={`${mp.card} mt-6 p-6`}>
                {hasPhysical && (
                  <p className="mb-4 text-xs text-[#FEE500]">
                    {shippingKrw === 0
                      ? `무료배송 적용 · 배송 상품 ${formatKrw(physicalSubtotalKrw)}`
                      : `무료배송까지 ${formatKrw(DEFAULT_FREE_THRESHOLD_KRW - physicalSubtotalKrw)} · 배송 상품 ${formatKrw(physicalSubtotalKrw)}`}
                  </p>
                )}
                <div className="flex justify-between text-sm text-neutral-400">
                  <span>상품 금액</span>
                  <span>{formatMinorAmount(subtotalMinor, currency)}</span>
                </div>
                <div className="mt-2 flex justify-between text-sm text-neutral-400">
                  <span>배송비</span>
                  <span className={shippingKrw === 0 ? "text-[#FEE500]" : ""}>
                    {hasPhysical
                      ? formatMinorAmount(convertKrwToMinor(shippingKrw, currency), currency)
                      : "—"}
                  </span>
                </div>
                <div className="mt-4 flex justify-between border-t border-white/10 pt-4 text-base font-semibold">
                  <span>결제 예정 금액</span>
                  <span>{formatMinorAmount(totalMinor, currency)}</span>
                </div>
                <Link href="/checkout/auth" className={`mt-5 flex w-full ${mp.creamBtn}`}>
                  주문하기
                </Link>
              </div>
            </>
          )}
        </div>
      </CommerceAtmosphere>
      <Footer />
    </>
  );
}
