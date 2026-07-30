"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  buildCurrencies,
  convertKrwToMinor,
  formatMinorAmount,
  getCurrency,
  type CurrencyCode,
  type CurrencyOption,
  type RateMap,
} from "@/lib/currency";

interface CurrencyContextValue {
  currency: CurrencyOption;
  setCurrencyCode: (code: CurrencyCode) => void;
  formatKrw: (priceKrw: number) => string;
  toMinor: (priceKrw: number) => number;
  currencies: CurrencyOption[];
  ratesSource: "live" | "fallback" | "loading";
  ratesUpdatedAt: string | null;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);
const STORAGE_KEY = "kh-currency";

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [code, setCode] = useState<CurrencyCode>("KRW");
  const [rates, setRates] = useState<RateMap | undefined>(undefined);
  const [ratesSource, setRatesSource] = useState<"live" | "fallback" | "loading">(
    "loading",
  );
  const [ratesUpdatedAt, setRatesUpdatedAt] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as CurrencyCode | null;
    if (saved && buildCurrencies().some((c) => c.code === saved)) {
      setCode(saved);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/exchange-rates");
        if (!res.ok) throw new Error("rates fetch failed");
        const data = (await res.json()) as {
          source: "live" | "fallback";
          updatedAt: string | null;
          rates: RateMap;
        };
        if (cancelled) return;
        setRates(data.rates);
        setRatesSource(data.source);
        setRatesUpdatedAt(data.updatedAt);
      } catch {
        if (cancelled) return;
        setRates(undefined);
        setRatesSource("fallback");
        setRatesUpdatedAt(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setCurrencyCode = useCallback((next: CurrencyCode) => {
    setCode(next);
    localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const currencies = useMemo(() => buildCurrencies(rates), [rates]);
  const currency = useMemo(() => getCurrency(code, rates), [code, rates]);

  const value = useMemo<CurrencyContextValue>(
    () => ({
      currency,
      setCurrencyCode,
      formatKrw: (priceKrw: number) =>
        formatMinorAmount(convertKrwToMinor(priceKrw, currency), currency),
      toMinor: (priceKrw: number) => convertKrwToMinor(priceKrw, currency),
      currencies,
      ratesSource,
      ratesUpdatedAt,
    }),
    [currency, setCurrencyCode, currencies, ratesSource, ratesUpdatedAt],
  );

  return (
    <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within CurrencyProvider");
  return ctx;
}
