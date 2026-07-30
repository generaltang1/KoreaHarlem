"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { OrderDetailView, type OrderDetailData } from "@/components/commerce/OrderDetailView";
import { REFUNDABLE_STATUSES, CANCELLABLE_PENDING_STATUSES } from "@/lib/orders";
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
  created_at: string;
  items: OrderDetailData["items"];
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

  useEffect(() => {
    fetch(`/api/admin/orders/${orderId}`)
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.message || "불러오기 실패");
        setOrder(json.order);
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
      router.refresh();
      window.location.reload();
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
      router.refresh();
      window.location.reload();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "환불 실패");
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
          items: order.items,
        }}
        showActions={false}
      />

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
          <h2 className="text-sm font-medium uppercase tracking-wider">관리자 처리</h2>

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
