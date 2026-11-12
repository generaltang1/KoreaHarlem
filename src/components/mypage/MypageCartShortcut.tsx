"use client";

import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { mp } from "@/lib/mypageTheme";

export function MypageCartShortcut() {
  const { itemCount } = useCart();
  return (
    <Link
      href="/cart"
      className={`${mp.card} p-5 transition-colors hover:border-[rgba(251,194,1,0.45)]`}
    >
      <p className="text-sm font-semibold">장바구니</p>
      <p className={`mt-2 text-xs ${mp.muted}`}>담긴 상품 {itemCount}</p>
      <p className={`mt-3 text-xs ${mp.accent}`}>보기 →</p>
    </Link>
  );
}
