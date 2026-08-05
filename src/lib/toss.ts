import {
  convertKrwToMinor,
  getCurrency,
  minorToMajorNumber,
  type CurrencyCode,
  type CurrencyOption,
  type RateMap,
} from "@/lib/currency";

/** Toss settlement currencies we support end-to-end. */
export type TossPayCurrency = "KRW" | "USD" | "JPY";

export type TossPayMethod = "domestic_card" | "intl_card" | "paypal";

export function isForeignSettlement(currency: string): boolean {
  return currency === "USD" || currency === "JPY";
}

/** Client key for the MID that owns this settlement currency. */
export function getTossClientKey(settlementCurrency: TossPayCurrency): string | undefined {
  if (isForeignSettlement(settlementCurrency)) {
    return (
      process.env.NEXT_PUBLIC_TOSS_FOREIGN_CLIENT_KEY ||
      process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY
    );
  }
  return process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;
}

/** Server secret for confirm — foreign MID when paying USD/JPY. */
export function getTossSecretKey(settlementCurrency: string): string | undefined {
  if (isForeignSettlement(settlementCurrency)) {
    return process.env.TOSS_FOREIGN_SECRET_KEY || process.env.TOSS_SECRET_KEY;
  }
  return process.env.TOSS_SECRET_KEY;
}

/**
 * Map display currency + chosen method → actual Toss charge currency.
 * PayPal is always USD. Overseas card: USD/JPY if selected, else KRW (intl window).
 */
export function resolveSettlementCurrency(
  method: TossPayMethod,
  displayCode: CurrencyCode,
): TossPayCurrency {
  if (method === "paypal") return "USD";
  if (method === "domestic_card") return "KRW";
  // intl_card
  if (displayCode === "USD" || displayCode === "JPY") return displayCode;
  return "KRW";
}

export function buildSettlementCurrency(
  code: TossPayCurrency,
  rates?: RateMap,
): CurrencyOption {
  return getCurrency(code, rates);
}

/** Total in settlement minor units from cart KRW base. */
export function totalSettlementMinor(
  lines: { priceKrw: number; quantity: number }[],
  settlement: CurrencyOption,
): number {
  const totalKrw = lines.reduce((sum, l) => sum + l.priceKrw * l.quantity, 0);
  return convertKrwToMinor(totalKrw, settlement);
}

/** Value Toss expects in amount.value (won as integer, USD/JPY as major units). */
export function toTossAmountValue(minor: number, settlement: CurrencyOption): number {
  if (settlement.decimals === 0) return minor;
  return minorToMajorNumber(minor, settlement);
}

export interface TossCancelParams {
  paymentKey: string;
  settlementCurrency: string;
  cancelReason: string;
  cancelAmount?: number;
  idempotencyKey?: string;
}

export interface TossCancelResult {
  ok: true;
  payment: unknown;
}

export async function cancelTossPayment(
  params: TossCancelParams,
): Promise<{ ok: true; payment: unknown } | { ok: false; message: string; code?: string }> {
  const secretKey = getTossSecretKey(params.settlementCurrency);
  if (!secretKey) {
    return { ok: false, message: "토스 시크릿 키가 설정되지 않았습니다." };
  }

  const body: Record<string, unknown> = {
    cancelReason: params.cancelReason.slice(0, 200),
  };
  if (params.cancelAmount != null) {
    body.cancelAmount = params.cancelAmount;
  }

  const headers: Record<string, string> = {
    Authorization: `Basic ${Buffer.from(`${secretKey}:`).toString("base64")}`,
    "Content-Type": "application/json",
  };
  if (params.idempotencyKey) {
    headers["Idempotency-Key"] = params.idempotencyKey;
  }

  const res = await fetch(
    `https://api.tosspayments.com/v1/payments/${encodeURIComponent(params.paymentKey)}/cancel`,
    {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    },
  );

  const payment = await res.json();
  if (!res.ok) {
    return {
      ok: false,
      message: payment.message || "토스 환불 실패",
      code: payment.code,
    };
  }

  return { ok: true, payment };
}

export type TossPaymentLookup = {
  paymentKey: string;
  orderId: string;
  status: string;
  totalAmount: number;
  balanceAmount?: number;
  currency?: string;
  cancels?: { cancelAmount: number; cancelReason?: string; canceledAt?: string }[] | null;
};

/** 결제 조회 — 웹훅 검증용 */
export async function fetchTossPayment(
  paymentKey: string,
  settlementCurrency = "KRW",
): Promise<{ ok: true; payment: TossPaymentLookup } | { ok: false; message: string; code?: string }> {
  const secretKey = getTossSecretKey(settlementCurrency);
  if (!secretKey) {
    return { ok: false, message: "토스 시크릿 키가 설정되지 않았습니다." };
  }

  const res = await fetch(
    `https://api.tosspayments.com/v1/payments/${encodeURIComponent(paymentKey)}`,
    {
      headers: {
        Authorization: `Basic ${Buffer.from(`${secretKey}:`).toString("base64")}`,
      },
    },
  );
  const payment = await res.json();
  if (!res.ok) {
    return {
      ok: false,
      message: payment.message || "결제 조회 실패",
      code: payment.code,
    };
  }

  return {
    ok: true,
    payment: {
      paymentKey: payment.paymentKey,
      orderId: payment.orderId,
      status: payment.status,
      totalAmount: payment.totalAmount,
      balanceAmount: payment.balanceAmount,
      currency: payment.currency,
      cancels: payment.cancels ?? null,
    },
  };
}

/** DB total(minor) → Toss cancelAmount */
export function orderTotalToTossCancelAmount(totalMinor: number, currency: string): number {
  const settlement = getCurrency(currency) as CurrencyOption;
  return toTossAmountValue(totalMinor, settlement);
}


export function paypalCountryFromDisplay(displayCode: CurrencyCode): string {
  switch (displayCode) {
    case "JPY":
      return "JP";
    case "CNY":
      return "CN";
    case "GBP":
      return "GB";
    case "EUR":
      return "DE";
    case "RUB":
      return "RU";
    case "USD":
      return "US";
    default:
      return "KR";
  }
}
