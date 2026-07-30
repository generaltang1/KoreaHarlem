"use client";

import { useCurrency } from "@/context/CurrencyContext";
import type { CurrencyCode } from "@/lib/currency";

export function CurrencySelector() {
  const { currency, currencies, setCurrencyCode } = useCurrency();

  return (
    <label className="hidden items-center gap-1 sm:flex">
      <span className="sr-only">통화 선택</span>
      <select
        value={currency.code}
        onChange={(e) => setCurrencyCode(e.target.value as CurrencyCode)}
        className="max-w-[7.5rem] truncate border-0 bg-transparent py-2 text-[10px] uppercase tracking-widest outline-none"
        aria-label="통화"
      >
        {currencies.map((c) => (
          <option key={c.code} value={c.code}>
            {c.code} {c.symbol}
          </option>
        ))}
      </select>
    </label>
  );
}
