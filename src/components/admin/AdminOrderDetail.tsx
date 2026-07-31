"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { OrderDetailView, type OrderDetailData } from "@/components/commerce/OrderDetailView";
import { AdminCsPanel, type CsRequestItem } from "@/components/admin/AdminCsPanel";
import {
  REFUNDABLE_STATUSES,
  CANCELLABLE_PENDING_STATUSES,
  SHIPPING_COURIERS,
  canTransitionShipping,
} from "@/lib/orders";
import { getCurrency } from "@/lib/currency";
import { orderTotalToTossCancelAmount } from "@/lib/toss";

interface AdminOrderRecord {
  id: string;
  order_number: string | null;
  status: string;
  statusLabel: string;
  paymentMethodLabel: string;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  shipping_message: string | null;
  shipping: OrderDetailData["shipping"];
  currency: string;
  total: number;
  shipping_fee: number;
  toss_payment_key: string | null;
  cancel_reason: string | null;
  cancelled_at: string | null;
  refunded_at: string | null;
  refunded_amount: number | null;
  tracking_courier: string | null;
  tracking_number: string | null;
  prepared_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  created_at: string;
  items: OrderDetailData["items"];
  csRequests: CsRequestItem[];
}

interface AdminOrderDetailProps {
  orderId: string;
}

export function AdminOrderDetail({ orderId }: AdminOrderDetailProps) {
  const router = useRouter();
  const [order, setOrder] = useState<AdminOrderRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [reason, setReason] = useState("");
  const [partialAmount, setPartialAmount] = useState("");
  const [restoreStock, setRestoreStock] = useState(true);
  const [courier, setCourier] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");

  const reload = () => {
    router.refresh();
    window.location.reload();
  };

  useEffect(() => {
    fetch(`/api/admin/orders/${orderId}`)
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.message || "불러오기 실패");
        setOrder(json.order);
        setCourier(json.order.tracking_courier ?? "");
        setTrackingNumber(json.order.tracking_number ?? "");
        if (!json.order.csRequests) {
          json.order.csRequests = [];
        }
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "오류");
      })
      .finally(() => setLoading(false));
  }, [orderId]);

  const handlePendingCancel = async () => {
    if (!confirm("결제 대기 주문을 취소하고 재고를 복구할까요?")) return;
    setActionLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() || "관리자 주문 취소" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "취소 실패");
      reload();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "취소 실패");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRefund = async () => {
    if (!reason.trim()) {
      setError("환불 사유를 입력해주세요.");
      return;
    }
    if (!confirm("토스 환불 API를 호출합니다. 계속할까요?")) return;

    setActionLoading(true);
    setError("");
    try {
      const body: Record<string, unknown> = {
        reason: reason.trim(),
        restoreStock,
      };
      const partial = Number.parseFloat(partialAmount);
      if (partialAmount.trim() && Number.isFinite(partial) && partial > 0) {
        body.cancelAmount = partial;
      }

      const res = await fetch(`/api/admin/orders/${orderId}/refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "환불 실패");
      reload();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "환불 실패");
    } finally {
      setActionLoading(false);
    }
  };

  const handleShipping = async (action: "preparing" | "shipped" | "delivered") => {
    if (action === "shipped") {
      if (!courier.trim() || !trackingNumber.trim()) {
        setError("배송중 처리 시 택배사와 송장번호가 필요합니다.");
        return;
      }
      if (!confirm("송장을 등록하고 배송중으로 변경할까요?")) return;
    } else if (action === "preparing") {
      if (!confirm("배송준비중으로 변경할까요?")) return;
    } else if (action === "delivered") {
      if (!confirm("배송완료로 변경할까요?")) return;
    }

    setActionLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/shipping`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          trackingCourier: courier.trim() || undefined,
          trackingNumber: trackingNumber.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "배송 상태 변경 실패");
      reload();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "배송 상태 변경 실패");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <p className="text-sm text-muted">불러오는 중...</p>;
  if (!order) return <p className="text-sm text-rose-500">{error || "주문 없음"}</p>;

  const canCancelPending = CANCELLABLE_PENDING_STATUSES.includes(
    order.status as (typeof CANCELLABLE_PENDING_STATUSES)[number],
  );
  const canRefund = REFUNDABLE_STATUSES.includes(
    order.status as (typeof REFUNDABLE_STATUSES)[number],
  );
  const canPrepare = canTransitionShipping(order.status, "preparing");
  const canShip = canTransitionShipping(order.status, "shipped");
  const canDeliver = canTransitionShipping(order.status, "delivered");
  const showShippingPanel = canPrepare || canShip || canDeliver || ["preparing", "shipped", "delivered"].includes(order.status);
  const tossAmount = orderTotalToTossCancelAmount(order.total, order.currency);
  const currencyMeta = getCurrency(order.currency);

  return (
    <div className="space-y-8">
      <div>
        <Link href="/admin/orders" className="text-[10px] uppercase tracking-widest text-muted underline">
          ← 주문 목록
        </Link>
        <h1 className="mt-2 text-xl font-medium uppercase tracking-wider">
          주문 {order.order_number ?? order.id.slice(0, 8)}
        </h1>
        <p className="mt-1 text-sm text-muted">
          {order.statusLabel} · {new Date(order.created_at).toLocaleString("ko-KR")}
        </p>
      </div>

      {error && <p className="text-sm text-rose-500">{error}</p>}

      <OrderDetailView
        order={{
          orderNumber: order.order_number,
          statusLabel: order.statusLabel,
          paymentMethod: order.paymentMethodLabel,
          customerName: order.customer_name,
          customerEmail: order.customer_email,
          customerPhone: order.customer_phone,
          shippingMessage: order.shipping_message,
          shipping: order.shipping,
          currency: order.currency,
          total: order.total,
          shippingFee: order.shipping_fee,
          trackingCourier: order.tracking_courier,
          trackingNumber: order.tracking_number,
          items: order.items,
        }}
        showActions={false}
      />

      <AdminCsPanel orderId={orderId} requests={order.csRequests ?? []} />

      {showShippingPanel && (
        <section className="border border-border p-5">
          <h2 className="text-sm font-medium uppercase tracking-wider">배송 처리</h2>
          <p className="mt-2 text-xs text-muted">
            결제완료 → 배송준비중 → 송장등록(배송중) → 배송완료
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-[10px] uppercase tracking-widest text-muted">
                택배사
              </label>
              <select
                value={courier}
                onChange={(e) => setCourier(e.target.value)}
                className="w-full border border-border px-4 py-3 text-sm outline-none focus:border-foreground"
              >
                <option value="">선택</option>
                {SHIPPING_COURIERS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-[10px] uppercase tracking-widest text-muted">
                송장번호
              </label>
              <input
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="송장번호"
                className="w-full border border-border px-4 py-3 text-sm outline-none focus:border-foreground"
              />
            </div>
          </div>

          {(order.prepared_at || order.shipped_at || order.delivered_at) && (
            <dl className="mt-4 space-y-1 text-xs text-muted">
              {order.prepared_at && (
                <div>배송준비: {new Date(order.prepared_at).toLocaleString("ko-KR")}</div>
              )}
              {order.shipped_at && (
                <div>발송: {new Date(order.shipped_at).toLocaleString("ko-KR")}</div>
              )}
              {order.delivered_at && (
                <div>배송완료: {new Date(order.delivered_at).toLocaleString("ko-KR")}</div>
              )}
            </dl>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            {canPrepare && (
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => handleShipping("preparing")}
                className="border border-border px-4 py-2 text-xs uppercase tracking-widest disabled:opacity-50"
              >
                배송준비중
              </button>
            )}
            {canShip && (
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => handleShipping("shipped")}
                className="bg-foreground px-4 py-2 text-xs uppercase tracking-widest text-background disabled:opacity-50"
              >
                송장등록 · 배송중
              </button>
            )}
            {canDeliver && (
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => handleShipping("delivered")}
                className="border border-border px-4 py-2 text-xs uppercase tracking-widest disabled:opacity-50"
              >
                배송완료
              </button>
            )}
          </div>
        </section>
      )}

      {(order.cancel_reason || order.refunded_at) && (
        <section className="border border-border p-5 text-sm">
          <h2 className="font-medium">취소/환불 이력</h2>
          {order.cancel_reason && <p className="mt-2">사유: {order.cancel_reason}</p>}
          {order.refunded_at && (
            <p className="mt-1 text-muted">
              환불일: {new Date(order.refunded_at).toLocaleString("ko-KR")}
              {order.refunded_amount != null && (
                <> · 환불액 {order.refunded_amount} {order.currency}</>
              )}
            </p>
          )}
        </section>
      )}

      {(canCancelPending || canRefund) && (
        <section className="border border-border p-5">
          <h2 className="text-sm font-medium uppercase tracking-wider">취소 / 환불</h2>

          <div className="mt-4 space-y-4">
            <div>
              <label className="mb-1.5 block text-[10px] uppercase tracking-widest text-muted">
                사유 *
              </label>
              <input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={canRefund ? "고객 요청 환불" : "결제 미완료 주문 취소"}
                className="w-full border border-border px-4 py-3 text-sm outline-none focus:border-foreground"
              />
            </div>

            {canRefund && (
              <>
                <div>
                  <label className="mb-1.5 block text-[10px] uppercase tracking-widest text-muted">
                    부분 환불 금액 (비우면 전액)
                  </label>
                  <input
                    value={partialAmount}
                    onChange={(e) => setPartialAmount(e.target.value)}
                    placeholder={`전액: ${tossAmount}`}
                    className="w-full border border-border px-4 py-3 text-sm outline-none focus:border-foreground"
                  />
                  <p className="mt-1 text-[10px] text-muted">
                    토스 환불 단위: {tossAmount} {order.currency}
                    {currencyMeta.decimals > 0 ? " (소수 포함)" : ""}
                  </p>
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={restoreStock}
                    onChange={(e) => setRestoreStock(e.target.checked)}
                  />
                  전액 환불 시 재고 복구
                </label>
              </>
            )}

            <div className="flex flex-wrap gap-3">
              {canCancelPending && (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={handlePendingCancel}
                  className="border border-border px-4 py-2 text-xs uppercase tracking-widest disabled:opacity-50"
                >
                  결제 대기 취소
                </button>
              )}
              {canRefund && (
                <button
                  type="button"
                  disabled={actionLoading || !order.toss_payment_key}
                  onClick={handleRefund}
                  className="bg-foreground px-4 py-2 text-xs uppercase tracking-widest text-background disabled:opacity-50"
                >
                  {actionLoading ? "처리 중..." : "토스 환불 처리"}
                </button>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
