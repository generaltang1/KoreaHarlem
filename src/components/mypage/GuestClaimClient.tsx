"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { ClaimRequestForm, type ClaimItem } from "@/components/mypage/ClaimRequestForm";
import { OPEN_CS_STATUSES } from "@/lib/csRequests";
import { mp } from "@/lib/mypageTheme";

const STORAGE_KEY = "kh_guest_order_lookup";

type StoredLookup = {
  orderId: string;
  name: string;
  orderNumber: string;
  password: string;
};

export function GuestClaimClient({ orderId }: { orderId: string }) {
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const [orderStatus, setOrderStatus] = useState("");
  const [displayNumber, setDisplayNumber] = useState("");
  const [items, setItems] = useState<ClaimItem[]>([]);
  const [hasOpenRequest, setHasOpenRequest] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as StoredLookup;
      if (parsed.orderId === orderId && parsed.password) {
        setPassword(parsed.password);
        setName(parsed.name);
        setOrderNumber(parsed.orderNumber);
        void lookup(parsed.name, parsed.orderNumber, parsed.password);
      }
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const lookup = async (n: string, on: string, pw: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/orders/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: n.trim(), orderNumber: on.trim(), password: pw }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "조회 실패");
      if (json.order?.id !== orderId) {
        throw new Error("주문 정보가 일치하지 않습니다.");
      }
      setOrderStatus(json.order.status);
      setDisplayNumber(json.order.orderNumber ?? on);
      setItems(
        (json.order.items ?? []).map(
          (item: {
            id: string;
            product_id: string | null;
            title: string;
            size: string | null;
            quantity: number;
            unit_price: number;
            currency: string;
            image_url: string | null;
          }) => ({
            id: item.id,
            product_id: item.product_id,
            title: item.title,
            size: item.size,
            quantity: item.quantity,
            unit_price: item.unit_price,
            currency: item.currency,
            image_url: item.image_url,
          }),
        ),
      );
      setHasOpenRequest(
        (json.order.csRequests ?? []).some((r: { status: string }) =>
          (OPEN_CS_STATUSES as readonly string[]).includes(r.status),
        ),
      );
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          orderId,
          name: n.trim(),
          orderNumber: on.trim(),
          password: pw,
        } satisfies StoredLookup),
      );
      setAuthed(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "조회 중 오류");
      setAuthed(false);
    } finally {
      setLoading(false);
      setReady(true);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await lookup(name, orderNumber, password);
  };

  if (!ready && !authed && !name) {
    // first paint before session restore finishes
  }

  if (!authed) {
    return (
      <form onSubmit={handleSubmit} className={`${mp.card} space-y-4 p-5`}>
        <p className={`text-sm ${mp.muted}`}>
          비회원 교환·반품은 주문조회와 동일한 정보가 필요합니다.
        </p>
        <div>
          <label className={mp.label}>주문자 이름</label>
          <input className={mp.input} value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <label className={mp.label}>주문번호</label>
          <input
            className={mp.input}
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            required
          />
        </div>
        <div>
          <label className={mp.label}>주문 비밀번호</label>
          <input
            type="password"
            className={mp.input}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error ? <p className="text-sm text-rose-400">{error}</p> : null}
        <button type="submit" disabled={loading} className={mp.creamBtn}>
          {loading ? "확인 중..." : "확인 후 신청"}
        </button>
        <Link href="/order-inquiry" className="block text-xs text-[#FEE500] underline">
          주문조회로 이동
        </Link>
      </form>
    );
  }

  return (
    <ClaimRequestForm
      orderId={orderId}
      orderNumber={displayNumber}
      status={orderStatus}
      hasOpenRequest={hasOpenRequest}
      items={items}
      guestPassword={password}
      backHref="/order-inquiry"
    />
  );
}
