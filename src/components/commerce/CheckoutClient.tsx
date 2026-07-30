"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loadTossPayments } from "@tosspayments/tosspayments-sdk";
import { DaumPostcodeButton } from "@/components/commerce/DaumPostcodeButton";
import { useCart, type CartLine } from "@/context/CartContext";
import { useCurrency } from "@/context/CurrencyContext";
import {
  convertKrwToMinor,
  formatMinorAmount,
  type RateMap,
} from "@/lib/currency";
import { parseAddonsParam } from "@/lib/productDetail";
import { calcShippingFee } from "@/lib/shipping";
import { createClient } from "@/lib/supabase/client";
import {
  buildSettlementCurrency,
  getTossClientKey,
  paypalCountryFromDisplay,
  resolveSettlementCurrency,
  toTossAmountValue,
  totalSettlementMinor,
  type TossPayMethod,
} from "@/lib/toss";

export function CheckoutClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { items, clearCart } = useCart();
  const { currency, toMinor, formatKrw, ratesSource } = useCurrency();

  const [buyLines, setBuyLines] = useState<CartLine[] | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [name, setName] = useState("");
  const [postcode, setPostcode] = useState("");
  const [address, setAddress] = useState("");
  const [addressDetail, setAddressDetail] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [shippingMessage, setShippingMessage] = useState("");
  const [guestPassword, setGuestPassword] = useState("");
  const [guestPasswordConfirm, setGuestPasswordConfirm] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [payMethod, setPayMethod] = useState<TossPayMethod>("domestic_card");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [liveRates, setLiveRates] = useState<RateMap | undefined>(undefined);

  const buyId = searchParams.get("buy");
  const buySize = searchParams.get("size");
  const buyQty = Math.max(1, Number.parseInt(searchParams.get("qty") ?? "1", 10) || 1);
  const addonsParam = searchParams.get("addons");
  const autopay = searchParams.get("autopay") === "1";
  const [shippingKrw, setShippingKrw] = useState(0);
  const [userReady, setUserReady] = useState(false);
  const [autoTriggered, setAutoTriggered] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setIsLoggedIn(true);
        setEmail(data.user.email ?? "");
        setName(
          (data.user.user_metadata?.full_name as string) ||
            (data.user.user_metadata?.name as string) ||
            "",
        );
      }
      setUserReady(true);
    });
  }, []);

  useEffect(() => {
    fetch("/api/exchange-rates")
      .then((r) => r.json())
      .then((data: { rates?: RateMap }) => {
        if (data.rates) setLiveRates(data.rates);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (currency.code === "KRW") setPayMethod("domestic_card");
    else if (currency.code === "USD" || currency.code === "JPY") setPayMethod("intl_card");
    else setPayMethod("paypal");
  }, [currency.code]);

  useEffect(() => {
    if (!buyId) {
      setBuyLines(null);
      setShippingKrw(0);
      return;
    }
    const supabase = createClient();
    const addonSpecs = parseAddonsParam(addonsParam);

    (async () => {
      const { data: main } = await supabase
        .from("products")
        .select("*, product_images(*)")
        .eq("id", buyId)
        .maybeSingle();
      if (!main) return;

      const images = [...(main.product_images ?? [])].sort(
        (a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order,
      );
      const built: CartLine[] = [
        {
          key: `${main.id}::${buySize ?? ""}`,
          productId: main.id,
          title: main.title,
          imageUrl: images[0]?.url,
          size: buySize,
          quantity: buyQty,
          unitPriceMinor: toMinor(main.price_krw),
          priceKrw: main.price_krw,
          currency: currency.code,
          exchangeRate: currency.rateToKrw,
        },
      ];

      let merchandise = main.price_krw * buyQty;

      for (const spec of addonSpecs) {
        const { data: addon } = await supabase
          .from("products")
          .select("*, product_images(*)")
          .eq("id", spec.productId)
          .maybeSingle();
        if (!addon) continue;
        const addonImages = [...(addon.product_images ?? [])].sort(
          (a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order,
        );
        built.push({
          key: `${addon.id}::${spec.size}`,
          productId: addon.id,
          title: addon.title,
          imageUrl: addonImages[0]?.url,
          size: spec.size || null,
          quantity: 1,
          unitPriceMinor: toMinor(addon.price_krw),
          priceKrw: addon.price_krw,
          currency: currency.code,
          exchangeRate: currency.rateToKrw,
        });
        merchandise += addon.price_krw;
      }

      setBuyLines(built);
      setShippingKrw(
        calcShippingFee(
          merchandise,
          main.shipping_fee_krw ?? 4000,
          main.free_shipping_threshold_krw,
        ),
      );
    })();
  }, [buyId, buySize, buyQty, addonsParam, currency.code, currency.rateToKrw, toMinor]);

  const lines = buyLines ?? items;
  const settlementCode = resolveSettlementCurrency(payMethod, currency.code);
  const settlement = useMemo(
    () => buildSettlementCurrency(settlementCode, liveRates),
    [settlementCode, liveRates],
  );
  const merchandiseMinor = useMemo(
    () => totalSettlementMinor(lines, settlement),
    [lines, settlement],
  );
  const shippingMinor = useMemo(
    () => (buyId ? convertKrwToMinor(shippingKrw, settlement) : 0),
    [buyId, shippingKrw, settlement],
  );
  const settleMinor = merchandiseMinor + shippingMinor;

  useEffect(() => {
    if (
      !autopay ||
      !userReady ||
      !isLoggedIn ||
      autoTriggered ||
      loading ||
      lines.length === 0 ||
      ratesSource === "loading" ||
      !email.trim() ||
      !name.trim()
    ) {
      return;
    }
    setAutoTriggered(true);
    formRef.current?.requestSubmit();
  }, [
    autopay,
    userReady,
    isLoggedIn,
    autoTriggered,
    loading,
    lines.length,
    ratesSource,
    email,
    name,
  ]);

  const validate = (): string | null => {
    if (!name.trim()) return "받는사람 이름을 입력해주세요.";
    if (!postcode.trim() || !address.trim()) return "주소검색으로 배송지를 입력해주세요.";
    if (!phone.trim()) return "휴대전화 번호를 입력해주세요.";
    if (!email.trim()) return "이메일을 입력해주세요.";
    if (!isLoggedIn) {
      if (!guestPassword) return "비회원 주문조회 비밀번호를 입력해주세요.";
      if (guestPassword !== guestPasswordConfirm) return "비밀번호 확인이 일치하지 않습니다.";
      if (guestPassword.length < 8) return "비밀번호는 8자 이상이어야 합니다.";
    }
    if (!agreed) return "구매 약관에 동의해주세요.";
    return null;
  };

  const handlePay = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (lines.length === 0) {
      setError("결제할 상품이 없습니다.");
      return;
    }
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    if (ratesSource === "loading") {
      setError("환율을 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    const clientKey = getTossClientKey(settlementCode);
    if (!clientKey) {
      setError(
        settlementCode === "KRW"
          ? "토스 클라이언트 키가 없습니다. NEXT_PUBLIC_TOSS_CLIENT_KEY를 설정해주세요."
          : "외화 결제 키가 없습니다. NEXT_PUBLIC_TOSS_FOREIGN_CLIENT_KEY(또는 CLIENT_KEY)를 설정해주세요.",
      );
      return;
    }

    setLoading(true);
    try {
      const orderItems = lines.map((line) => ({
        productId: line.productId,
        title: line.title,
        size: line.size,
        quantity: line.quantity,
        unitPrice: convertKrwToMinor(line.priceKrw, settlement),
        currency: settlement.code,
        imageUrl: line.imageUrl,
        priceKrw: line.priceKrw,
      }));

      const orderRes = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim(),
          phone: phone.trim(),
          shippingMessage: shippingMessage.trim(),
          shipping: {
            postcode: postcode.trim(),
            address: address.trim(),
            addressDetail: addressDetail.trim(),
            phone: phone.trim(),
          },
          currency: settlement.code,
          exchangeRate: settlement.rateToKrw,
          paymentMethod: payMethod,
          items: orderItems,
          total: settleMinor,
          shippingFee: shippingKrw,
          guestPassword: isLoggedIn ? undefined : guestPassword,
        }),
      });
      const orderJson = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderJson.message || "주문 생성 실패");

      const toss = await loadTossPayments(clientKey);
      const payment = toss.payment({ customerKey: orderJson.customerKey });
      const amountValue = toTossAmountValue(settleMinor, settlement);
      const orderName =
        lines[0].title + (lines.length > 1 ? ` 외 ${lines.length - 1}건` : "");
      const successUrl = `${window.location.origin}/checkout/success`;
      const failUrl = `${window.location.origin}/checkout/fail`;

      if (payMethod === "paypal") {
        await payment.requestPayment({
          method: "FOREIGN_EASY_PAY",
          amount: { currency: "USD", value: amountValue },
          orderId: orderJson.tossOrderId,
          orderName,
          successUrl,
          failUrl,
          customerEmail: email.trim(),
          customerName: name.trim(),
          foreignEasyPay: {
            provider: "PAYPAL",
            country: paypalCountryFromDisplay(currency.code),
            products: lines.map((line) => ({
              name: line.title.slice(0, 127),
              description: (line.size ? `${line.title} / ${line.size}` : line.title).slice(0, 127),
              quantity: line.quantity,
              unitAmount: toTossAmountValue(
                convertKrwToMinor(line.priceKrw, settlement),
                settlement,
              ),
              currency: "USD" as const,
            })),
          },
        });
      } else if (payMethod === "intl_card") {
        await payment.requestPayment({
          method: "CARD",
          amount: { currency: settlementCode, value: amountValue },
          orderId: orderJson.tossOrderId,
          orderName,
          successUrl,
          failUrl,
          customerEmail: email.trim(),
          customerName: name.trim(),
          card: { useInternationalCardOnly: true },
        });
      } else {
        await payment.requestPayment({
          method: "CARD",
          amount: { currency: "KRW", value: amountValue },
          orderId: orderJson.tossOrderId,
          orderName,
          successUrl,
          failUrl,
          customerEmail: email.trim(),
          customerName: name.trim(),
        });
      }

      if (!buyId) clearCart();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "결제 요청 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  if (lines.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="text-sm text-muted">장바구니가 비어 있습니다.</p>
        <button
          type="button"
          onClick={() => router.push("/sale")}
          className="mt-4 text-xs uppercase tracking-widest underline"
        >
          Sale로 이동
        </button>
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={handlePay} className="mx-auto max-w-3xl space-y-10">
      <h1 className="text-xl font-medium uppercase tracking-wider">주문 / 결제</h1>

      {/* 배송지 */}
      <section className="border border-border p-5">
        <h2 className="text-sm font-medium uppercase tracking-wider">배송지</h2>
        <div className="mt-5 space-y-4">
          <Field label="받는사람 *">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className={inputClass}
            />
          </Field>
          <Field label="우편번호 *">
            <div className="flex gap-2">
              <input
                value={postcode}
                readOnly
                required
                placeholder="주소검색을 이용해주세요"
                className={inputClass}
              />
              <DaumPostcodeButton
                onComplete={(data) => {
                  setPostcode(data.postcode);
                  setAddress(data.address);
                }}
              />
            </div>
          </Field>
          <Field label="기본주소 *">
            <input value={address} readOnly required className={inputClass} />
          </Field>
          <Field label="상세주소">
            <input
              value={addressDetail}
              onChange={(e) => setAddressDetail(e.target.value)}
              placeholder="동·호수 등"
              className={inputClass}
            />
          </Field>
          <Field label="휴대전화 *">
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="010-1234-5678"
              required
              className={inputClass}
            />
          </Field>
          <Field label="이메일 *">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={inputClass}
            />
          </Field>
          <Field label="배송메시지">
            <input
              value={shippingMessage}
              onChange={(e) => setShippingMessage(e.target.value)}
              placeholder="배송 시 요청사항"
              className={inputClass}
            />
          </Field>

          {!isLoggedIn && (
            <>
              <Field label="비회원 주문조회 비밀번호 *">
                <input
                  type="password"
                  value={guestPassword}
                  onChange={(e) => setGuestPassword(e.target.value)}
                  minLength={8}
                  autoComplete="new-password"
                  placeholder="8자 이상"
                  className={inputClass}
                />
                <p className="mt-1 text-[10px] text-muted">
                  주문조회 시 필요합니다. 꼭 기억해주세요.
                </p>
              </Field>
              <Field label="비밀번호 확인 *">
                <input
                  type="password"
                  value={guestPasswordConfirm}
                  onChange={(e) => setGuestPasswordConfirm(e.target.value)}
                  autoComplete="new-password"
                  className={inputClass}
                />
              </Field>
            </>
          )}
        </div>
      </section>

      {/* 주문상품 */}
      <section className="border border-border p-5">
        <h2 className="text-sm font-medium uppercase tracking-wider">주문상품</h2>
        <ul className="mt-4 divide-y divide-border">
          {lines.map((line) => (
            <li key={line.key} className="flex gap-4 py-4 text-sm">
              {line.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={line.imageUrl} alt="" className="h-20 w-20 shrink-0 object-cover" />
              )}
              <div className="min-w-0 flex-1">
                <p className="font-medium">{line.title}</p>
                {line.size && <p className="text-xs text-muted">사이즈: {line.size}</p>}
                <p className="text-xs text-muted">수량: {line.quantity}</p>
              </div>
              <p className="shrink-0">
                {formatMinorAmount(line.unitPriceMinor * line.quantity, currency)}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* 결제정보 */}
      <section className="border border-border p-5">
        <h2 className="text-sm font-medium uppercase tracking-wider">결제정보</h2>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">상품금액</dt>
            <dd>{formatMinorAmount(merchandiseMinor, settlement)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">배송비</dt>
            <dd>
              {buyId
                ? shippingKrw > 0
                  ? formatKrw(shippingKrw)
                  : "무료"
                : "장바구니 결제 시 별도"}
            </dd>
          </div>
          <div className="flex justify-between border-t border-border pt-3 font-medium">
            <dt>총 결제금액</dt>
            <dd>
              {formatMinorAmount(settleMinor, settlement)} {settlement.code}
            </dd>
          </div>
        </dl>
      </section>

      {/* 결제수단 */}
      <section className="border border-border p-5">
        <h2 className="text-sm font-medium uppercase tracking-wider">결제수단</h2>
        <fieldset className="mt-4 space-y-2">
          <PayMethodOption
            checked={payMethod === "domestic_card"}
            onChange={() => setPayMethod("domestic_card")}
            title="국내 카드"
            desc="한국 발행 카드 · KRW"
          />
          <PayMethodOption
            checked={payMethod === "intl_card"}
            onChange={() => setPayMethod("intl_card")}
            title="해외 카드"
            desc={
              currency.code === "USD"
                ? "VISA / MASTER / JCB · USD"
                : currency.code === "JPY"
                  ? "VISA / MASTER / JCB · JPY"
                  : "VISA / MASTER / JCB · KRW"
            }
          />
          <PayMethodOption
            checked={payMethod === "paypal"}
            onChange={() => setPayMethod("paypal")}
            title="PayPal"
            desc="해외 간편결제 · USD"
          />
        </fieldset>
      </section>

      {/* 약관 */}
      <section className="border border-border p-5">
        <label className="flex cursor-pointer items-start gap-3 text-sm">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-1"
          />
          <span>
            구매 약관 및 개인정보 수집·이용에 동의합니다. (필수)
          </span>
        </label>
      </section>

      {error && <p className="text-sm text-rose-500">{error}</p>}

      <button
        type="submit"
        disabled={loading || ratesSource === "loading"}
        className="w-full bg-foreground py-4 text-xs uppercase tracking-widest text-background disabled:opacity-50"
      >
        {loading
          ? "결제 준비 중..."
          : `결제하기 · ${formatMinorAmount(settleMinor, settlement)} ${settlement.code}`}
      </button>
    </form>
  );
}

const inputClass =
  "w-full border border-border px-4 py-3 text-sm outline-none focus:border-foreground";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-[10px] uppercase tracking-widest text-muted">
        {label}
      </label>
      {children}
    </div>
  );
}

function PayMethodOption({
  checked,
  onChange,
  title,
  desc,
}: {
  checked: boolean;
  onChange: () => void;
  title: string;
  desc: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 border border-border px-3 py-3 has-[:checked]:border-foreground">
      <input
        type="radio"
        name="payMethod"
        checked={checked}
        onChange={onChange}
        className="mt-0.5"
      />
      <span>
        <span className="block text-sm font-medium">{title}</span>
        <span className="mt-0.5 block text-[10px] text-muted">{desc}</span>
      </span>
    </label>
  );
}
