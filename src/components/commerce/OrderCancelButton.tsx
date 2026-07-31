"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { isMemberCancellableStatus } from "@/lib/orders";

interface OrderCancelButtonProps {
  orderId: string;
  status: string;
}

export function OrderCancelButton({ orderId, status }: OrderCancelButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isMemberCancellableStatus(status)) return null;

  const needsRefund = status === "paid" || status === "preparing";

  const handleCancel = async () => {
    if (
      !confirm(
        needsRefund
          ? "주문을 취소하고 결제 금액을 환불할까요?"
          : "주문을 취소할까요? 예약된 재고가 복구됩니다.",
      )
    ) {
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/orders/${orderId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: reason.trim() || "구매자 주문 취소",
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "취소 실패");
      setOpen(false);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "취소 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mt-8 border border-border p-5">
      <h2 className="text-sm font-medium uppercase tracking-wider">주문 취소</h2>
      <p className="mt-2 text-xs text-muted">
        배송 시작 전(결제대기·결제완료·배송준비중)만 직접 취소할 수 있습니다.
        {needsRefund && " 결제 완료 주문은 토스를 통해 전액 환불됩니다."}
      </p>

      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-4 border border-border px-4 py-2 text-xs uppercase tracking-widest"
        >
          주문 취소하기
        </button>
      ) : (
        <div className="mt-4 space-y-3">
          <div>
            <label className="mb-1.5 block text-[10px] uppercase tracking-widest text-muted">
              취소 사유 (선택)
            </label>
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="단순 변심, 주문 실수 등"
              className="w-full border border-border px-4 py-3 text-sm outline-none focus:border-foreground"
            />
          </div>
          {error && <p className="text-sm text-rose-500">{error}</p>}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={handleCancel}
              className="bg-foreground px-4 py-2 text-xs uppercase tracking-widest text-background disabled:opacity-50"
            >
              {loading ? "처리 중..." : needsRefund ? "취소 및 환불" : "취소 확정"}
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => {
                setOpen(false);
                setError("");
              }}
              className="border border-border px-4 py-2 text-xs uppercase tracking-widest disabled:opacity-50"
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
