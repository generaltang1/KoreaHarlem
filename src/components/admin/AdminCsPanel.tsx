"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  csRequestStatusLabel,
  csRequestTypeLabel,
  type CsRequestStatus,
} from "@/lib/csRequests";

export interface CsRequestItem {
  id: string;
  request_type: string;
  status: string;
  reason: string;
  admin_note: string | null;
  exchange_size: string | null;
  order_item_id?: string | null;
  hold_size?: string | null;
  hold_quantity?: number | null;
  stock_held_at?: string | null;
  stock_released_at?: string | null;
  stock_completed_at?: string | null;
  item_title?: string | null;
  item_size?: string | null;
  created_at: string;
  resolved_at: string | null;
}

interface AdminCsPanelProps {
  orderId: string;
  requests: CsRequestItem[];
}

export function AdminCsPanel({ orderId, requests }: AdminCsPanelProps) {
  const router = useRouter();
  const [adminNote, setAdminNote] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [runTossRefund, setRunTossRefund] = useState(true);
  const [restoreStock, setRestoreStock] = useState(true);

  if (requests.length === 0) return null;

  const hasOpenReturnRefund = requests.some(
    (r) =>
      ["requested", "approved", "received"].includes(r.status) &&
      (r.request_type === "return" || r.request_type === "refund"),
  );

  const runAction = async (
    requestId: string,
    action: "approve" | "reject" | "received" | "complete",
  ) => {
    const labels = {
      approve: "승인",
      reject: "반려",
      received: "회수·검수 완료",
      complete: "처리 완료(환불 포함 가능)",
    };
    if (!confirm(`${labels[action]} 처리할까요?`)) return;

    setLoadingId(requestId);
    setError("");
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/cs/${requestId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          adminNote: adminNote.trim() || undefined,
          runTossRefund,
          restoreStock,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "처리 실패");
      router.refresh();
      window.location.reload();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "처리 실패");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <section className="border border-border p-5">
      <h2 className="text-sm font-medium uppercase tracking-wider">CS 요청 (반품/교환/환불)</h2>

      <div className="mt-4 space-y-4">
        {requests.map((req) => {
          const open = ["requested", "approved", "received"].includes(req.status);
          const isExchange = req.request_type === "exchange";
          return (
            <div key={req.id} className="border border-border p-4 text-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium">
                    {csRequestTypeLabel(req.request_type)} · {csRequestStatusLabel(req.status)}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {new Date(req.created_at).toLocaleString("ko-KR")}
                  </p>
                </div>
              </div>
              <p className="mt-3">사유: {req.reason}</p>
              {(req.item_title || req.item_size) && (
                <p className="mt-1 text-muted">
                  대상 상품: {req.item_title ?? "상품"}
                  {req.item_size ? ` / ${req.item_size}` : ""}
                </p>
              )}
              {req.exchange_size && (
                <p className="mt-1 text-muted">희망 사이즈: {req.exchange_size}</p>
              )}
              {isExchange && (req.stock_held_at || req.stock_completed_at) && (
                <div className="mt-2 border border-dashed border-border p-2 text-xs text-muted">
                  {req.stock_held_at && (
                    <p>
                      희망 사이즈 재고 hold: {req.hold_size || "-"}
                      {req.hold_quantity != null ? ` × ${req.hold_quantity}` : ""} (
                      {new Date(req.stock_held_at).toLocaleString("ko-KR")})
                    </p>
                  )}
                  {req.stock_released_at && (
                    <p>hold 해제: {new Date(req.stock_released_at).toLocaleString("ko-KR")}</p>
                  )}
                  {req.stock_completed_at && (
                    <p>
                      교환 재고 처리 완료: {new Date(req.stock_completed_at).toLocaleString("ko-KR")}
                    </p>
                  )}
                </div>
              )}
              {req.admin_note && <p className="mt-1 text-muted">관리자 메모: {req.admin_note}</p>}

              {open && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {req.status === "requested" && (
                    <>
                      <button
                        type="button"
                        disabled={!!loadingId}
                        onClick={() => runAction(req.id, "approve")}
                        className="border border-border px-3 py-1.5 text-xs uppercase tracking-widest disabled:opacity-50"
                      >
                        승인
                      </button>
                      <button
                        type="button"
                        disabled={!!loadingId}
                        onClick={() => runAction(req.id, "reject")}
                        className="border border-border px-3 py-1.5 text-xs uppercase tracking-widest disabled:opacity-50"
                      >
                        반려
                      </button>
                    </>
                  )}
                  {(req.status === "requested" || req.status === "approved") &&
                    (req.request_type === "return" || req.request_type === "exchange") && (
                      <button
                        type="button"
                        disabled={!!loadingId}
                        onClick={() => runAction(req.id, "received")}
                        className="border border-border px-3 py-1.5 text-xs uppercase tracking-widest disabled:opacity-50"
                      >
                        회수·검수 완료
                      </button>
                    )}
                  <button
                    type="button"
                    disabled={!!loadingId}
                    onClick={() => runAction(req.id, "complete")}
                    className="bg-foreground px-3 py-1.5 text-xs uppercase tracking-widest text-background disabled:opacity-50"
                  >
                    {loadingId === req.id ? "처리 중..." : "처리 완료"}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 space-y-3 border-t border-border pt-4">
        <div>
          <label className="mb-1.5 block text-[10px] uppercase tracking-widest text-muted">
            관리자 메모
          </label>
          <input
            value={adminNote}
            onChange={(e) => setAdminNote(e.target.value)}
            className="w-full border border-border px-4 py-3 text-sm outline-none focus:border-foreground"
            placeholder="반려 사유, 검수 메모 등"
          />
        </div>
        {hasOpenReturnRefund && (
          <>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={runTossRefund}
                onChange={(e) => setRunTossRefund(e.target.checked)}
              />
              처리 완료 시 토스 환불 실행 (반품/환불)
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={restoreStock}
                onChange={(e) => setRestoreStock(e.target.checked)}
              />
              처리 완료 시 재고 복구 (반품/환불)
            </label>
          </>
        )}
        {error && <p className="text-sm text-rose-500">{error}</p>}
      </div>
    </section>
  );
}

export type { CsRequestStatus };
