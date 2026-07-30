export type CurrencyCode = "KRW" | "USD" | "EUR" | "JPY" | "GBP" | "CNY" | "RUB";

export interface CurrencyOption {
  code: CurrencyCode;
  country: string;
  symbol: string;
  /** KRW per 1 unit of this currency (e.g. USD ≈ 1440) */
  rateToKrw: number;
  /** 0 for KRW/JPY, 2 for most others */
  decimals: number;
}

type CurrencyMeta = Omit<CurrencyOption, "rateToKrw">;

const CURRENCY_META: CurrencyMeta[] = [
  { code: "KRW", country: "South Korea", symbol: "₩", decimals: 0 },
  { code: "USD", country: "United States", symbol: "$", decimals: 2 },
  { code: "EUR", country: "Eurozone", symbol: "€", decimals: 2 },
  { code: "JPY", country: "Japan", symbol: "¥", decimals: 0 },
  { code: "GBP", country: "United Kingdom", symbol: "£", decimals: 2 },
  { code: "CNY", country: "China", symbol: "CN¥", decimals: 2 },
  { code: "RUB", country: "Russia", symbol: "₽", decimals: 2 },
];

/** Used only when the live rate API is unavailable. */
export const FALLBACK_RATES: Record<CurrencyCode, number> = {
  KRW: 1,
  USD: 1440,
  EUR: 1650,
  JPY: 9,
  GBP: 1930,
  CNY: 215,
  RUB: 18,
};

export type RateMap = Partial<Record<CurrencyCode, number>>;

export function buildCurrencies(rates?: RateMap): CurrencyOption[] {
  return CURRENCY_META.map((meta) => ({
    ...meta,
    rateToKrw: rates?.[meta.code] ?? FALLBACK_RATES[meta.code],
  }));
}

/** Static fallback list (same shape as before for imports). */
export const CURRENCIES: CurrencyOption[] = buildCurrencies();

export function getCurrency(code: string, rates?: RateMap): CurrencyOption {
  const list = buildCurrencies(rates);
  return list.find((c) => c.code === code) ?? list[0];
}

/** Convert KRW integer to minor units of target currency (won or cents). */
export function convertKrwToMinor(priceKrw: number, currency: CurrencyOption): number {
  if (currency.code === "KRW") return Math.round(priceKrw);
  const major = priceKrw / currency.rateToKrw;
  const factor = 10 ** currency.decimals;
  return Math.round(major * factor);
}

export function formatMinorAmount(minor: number, currency: CurrencyOption): string {
  const factor = 10 ** currency.decimals;
  const major = currency.decimals === 0 ? minor : minor / factor;
  if (currency.code === "KRW") {
    return `${currency.symbol}${Math.round(major).toLocaleString("ko-KR")}`;
  }
  return `${currency.symbol}${major.toLocaleString("en-US", {
    minimumFractionDigits: currency.decimals,
    maximumFractionDigits: currency.decimals,
  })}`;
}

export function minorToMajorNumber(minor: number, currency: CurrencyOption): number {
  const factor = 10 ** currency.decimals;
  return currency.decimals === 0 ? minor : minor / factor;
}
