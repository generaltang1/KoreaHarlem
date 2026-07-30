import { NextResponse } from "next/server";
import {
  FALLBACK_RATES,
  type CurrencyCode,
  type RateMap,
} from "@/lib/currency";

const CODES: CurrencyCode[] = ["KRW", "USD", "EUR", "JPY", "GBP", "CNY", "RUB"];

/**
 * Live FX rates as KRW per 1 unit of foreign currency.
 * Cached ~1h (upstream updates about once a day).
 */
export async function GET() {
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/KRW", {
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error(`upstream ${res.status}`);

    const data = (await res.json()) as {
      result?: string;
      time_last_update_utc?: string;
      rates?: Record<string, number>;
    };

    if (data.result !== "success" || !data.rates) {
      throw new Error("invalid upstream payload");
    }

    const rates: RateMap = { KRW: 1 };
    for (const code of CODES) {
      if (code === "KRW") continue;
      const perKrw = data.rates[code];
      if (typeof perKrw !== "number" || perKrw <= 0) {
        rates[code] = FALLBACK_RATES[code];
        continue;
      }
      // API: 1 KRW = perKrw units → 1 unit = 1/perKrw KRW
      rates[code] = Math.round((1 / perKrw) * 100) / 100;
    }

    return NextResponse.json({
      source: "live",
      updatedAt: data.time_last_update_utc ?? null,
      rates,
    });
  } catch {
    return NextResponse.json({
      source: "fallback",
      updatedAt: null,
      rates: FALLBACK_RATES,
    });
  }
}
