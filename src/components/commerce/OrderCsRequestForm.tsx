"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { canRequestCs, type CsRequestType } from "@/lib/csRequests";

interface OrderCsRequestFormProps {
  orderId: string;
  status: string;
  hasOpenRequest: boolean;
}

export function OrderCsRequestForm({ orderId, status, hasOpenRequest }: OrderCsRequestFormProps) {
  const router = useRouter();
  const [type, setType] = useState<CsRequestType>("return");
  const [reason, setReason] = useState("");
  const [exchangeSize, setExchangeSize] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!canRequestCs(status) || hasOpenRequest) return null;

  const handleSubmit = async () => {
    if (!reason.trim()) {
      setError("사유를 입력해주세요.");
      return;
    }
    if (type === "exchange" && !exchangeSize.trim()) {
      setError("교환 희망 사이즈를 입력해주세요.");
      return;
    }
    if (!confirm("요청을 접수할까요? 관리자 확인 후 처리됩니다.")) return;

    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/orders/${orderId}/cs-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          reason: reason.trim(),
          exchangeSize: exchangeSize.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "요청 실패");
      setOpen(false);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "요청 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mt-8 border border-border p-5">
      <h2 className="text-sm font-medium uppercase tracking-wider">반품 / 교환 / 환불</h2>
      <p className="mt-2 text-xs text-muted">
        배송중·배송완료 주문만 요청할 수 있습니다. 승인·검수 후 환불/교환이 진행됩니다.
      </p>

      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-4 border border-border px-4 py-2 text-xs uppercase tracking-widest"
        >
          요청하기
        </button>
      ) : (
        <div className="mt-4 space-y-3">
          <fieldset className="space-y-2">
            <legend className="mb-1 text-[10px] uppercase tracking-widest text-muted">유형</legend>
            {(
              [
                { value: "return", label: "반품 (상품 반송 후 환불)" },
                { value: "exchange", label: "교환 (사이즈 등)" },
                { value: "refund", label: "환불 요청" },
              ] as const
            ).map((opt) => (
              <label key={opt.value} className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="csType"
                  checked={type === opt.value}
                  onChange={() => setType(opt.value)}
                />
                {opt.label}
              </label>
            ))}
          </fieldset>

          {type === "exchange" && (
            <div>
              <label className="mb-1.5 block text-[10px] uppercase tracking-widest text-muted">
                교환 희망 사이즈 *
              </label>
              <input
                value={exchangeSize}
                onChange={(e) => setExchangeSize(e.target.value)}
                placeholder="예: L"
                className="w-full border border-border px-4 py-3 text-sm outline-none focus:border-foreground"
              />
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-[10px] uppercase tracking-widest text-muted">
              사유 *
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="요청 사유를 입력해주세요"
              className="w-full resize-none border border-border px-4 py-3 text-sm outline-none focus:border-foreground"
            />
          </div>

          {error && <p className="text-sm text-rose-500">{error}</p>}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={handleSubmit}
              className="bg-foreground px-4 py-2 text-xs uppercase tracking-widest text-background disabled:opacity-50"
            >
              {loading ? "접수 중..." : "요청 접수"}
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => {
                setOpen(false);
                setError("");
              }}
              className="border border-border px-4 py-2 text-xs uppercase tracking-widest"
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
