"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { orderStatusLabel, SHIPPING_COURIERS } from "@/lib/orders";

export type AdminOrderListItem = {
  id: string;
  order_number: string | null;
  status: string;
  customer_name: string | null;
  customer_email: string | null;
  total: number | null;
  currency: string | null;
  created_at: string;
  admin_memo?: string | null;
  tracking_courier?: string | null;
  tracking_number?: string | null;
};

interface AdminOrdersBulkListProps {
  orders: AdminOrderListItem[];
}

type RowDraft = {
  admin_memo: string;
  tracking_courier: string;
  tracking_number: string;
};

function draftFromOrder(order: AdminOrderListItem): RowDraft {
  return {
    admin_memo: order.admin_memo ?? "",
    tracking_courier: order.tracking_courier ?? "",
    tracking_number: order.tracking_number ?? "",
  };
}

export function AdminOrdersBulkList({ orders }: AdminOrdersBulkListProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [targetStatus, setTargetStatus] = useState<"preparing" | "shipped" | "delivered">(
    "preparing",
  );
  const [bulkCourier, setBulkCourier] = useState<string>(SHIPPING_COURIERS[0]);
  const [bulkTracking, setBulkTracking] = useState("");
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [resultMsg, setResultMsg] = useState("");
  const [drafts, setDrafts] = useState<Record<string, RowDraft>>(() =>
    Object.fromEntries(orders.map((o) => [o.id, draftFromOrder(o)])),
  );

  useEffect(() => {
    setDrafts(Object.fromEntries(orders.map((o) => [o.id, draftFromOrder(o)])));
  }, [orders]);

  const allIds = useMemo(() => orders.map((o) => o.id), [orders]);
  const allSelected = allIds.length > 0 && allIds.every((id) => selected.has(id));

  const getDraft = (order: AdminOrderListItem): RowDraft =>
    drafts[order.id] ?? draftFromOrder(order);

  const updateDraft = (id: string, patch: Partial<RowDraft>) => {
    setDrafts((prev) => ({
      ...prev,
      [id]: { ...(prev[id] ?? draftFromOrder(orders.find((o) => o.id === id)!)), ...patch },
    }));
  };

  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(allIds));
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const patchOrder = async (id: string, body: Record<string, unknown>) => {
    const res = await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "저장 실패");
  };

  const saveMemo = async (order: AdminOrderListItem) => {
    setSavingId(`${order.id}:memo`);
    setError("");
    try {
      await patchOrder(order.id, { admin_memo: getDraft(order).admin_memo });
      setResultMsg("관리자 메모 저장됨");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "메모 저장 실패");
    } finally {
      setSavingId(null);
    }
  };

  const saveShipping = async (order: AdminOrderListItem) => {
    const draft = getDraft(order);
    setSavingId(`${order.id}:ship`);
    setError("");
    try {
      await patchOrder(order.id, {
        tracking_courier: draft.tracking_courier || null,
        tracking_number: draft.tracking_number || null,
      });
      setResultMsg("택배·송장 저장됨");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "송장 저장 실패");
    } finally {
      setSavingId(null);
    }
  };

  const runBulk = async () => {
    const ids = [...selected];
    if (ids.length === 0) {
      setError("주문을 선택해주세요.");
      return;
    }
    if (targetStatus === "shipped" && (!bulkCourier.trim() || !bulkTracking.trim())) {
      setError("배송중 일괄 변경 시 택배사·송장번호가 필요합니다.");
      return;
    }

    const label = orderStatusLabel(targetStatus);
    if (!confirm(`선택한 ${ids.length}건을 «${label}»로 변경할까요?\n전환 불가 건은 건너뜁니다.`)) {
      return;
    }

    setLoading(true);
    setError("");
    setResultMsg("");
    try {
      const res = await fetch("/api/admin/orders/bulk-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderIds: ids,
          status: targetStatus,
          trackingCourier: targetStatus === "shipped" ? bulkCourier : undefined,
          trackingNumber: targetStatus === "shipped" ? bulkTracking.trim() : undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "일괄 변경 실패");

      setResultMsg(
        `성공 ${json.successCount}건` +
          (json.failCount ? ` · 실패/건너뜀 ${json.failCount}건` : ""),
      );
      setSelected(new Set());
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "일괄 변경 실패");
    } finally {
      setLoading(false);
    }
  };

  if (orders.length === 0) {
    return (
      <p className="border border-border p-8 text-center text-sm text-muted">주문이 없습니다.</p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="border border-border p-4">
        <p className="text-[10px] uppercase tracking-widest text-muted">일괄 배송 상태</p>
        <p className="mt-1 text-xs text-muted">
          선택 주문만 배송준비중 → 배송중 → 배송완료 흐름으로 변경합니다. (CS·결제 상태는 상세에서
          처리)
        </p>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-[10px] uppercase tracking-widest text-muted">
              목표 상태
            </label>
            <select
              value={targetStatus}
              onChange={(e) =>
                setTargetStatus(e.target.value as "preparing" | "shipped" | "delivered")
              }
              className="border border-border px-3 py-2 text-sm outline-none focus:border-foreground"
            >
              <option value="preparing">배송준비중</option>
              <option value="shipped">배송중</option>
              <option value="delivered">배송완료</option>
            </select>
          </div>
          {targetStatus === "shipped" && (
            <>
              <div>
                <label className="mb-1 block text-[10px] uppercase tracking-widest text-muted">
                  택배사
                </label>
                <select
                  value={bulkCourier}
                  onChange={(e) => setBulkCourier(e.target.value)}
                  className="border border-border px-3 py-2 text-sm outline-none focus:border-foreground"
                >
                  {SHIPPING_COURIERS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[10px] uppercase tracking-widest text-muted">
                  송장번호
                </label>
                <input
                  value={bulkTracking}
                  onChange={(e) => setBulkTracking(e.target.value)}
                  className="border border-border px-3 py-2 text-sm outline-none focus:border-foreground"
                  placeholder="공통 송장(선택 건 동일 적용)"
                />
              </div>
            </>
          )}
          <button
            type="button"
            disabled={loading || selected.size === 0}
            onClick={() => void runBulk()}
            className="bg-foreground px-4 py-2 text-[10px] uppercase tracking-widest text-background disabled:opacity-50"
          >
            {loading ? "처리 중..." : `선택 ${selected.size}건 변경`}
          </button>
        </div>
        {error && <p className="mt-2 text-sm text-rose-500">{error}</p>}
        {resultMsg && <p className="mt-2 text-sm text-muted">{resultMsg}</p>}
      </div>

      <div className="flex items-center gap-2 border border-border px-4 py-2 text-sm">
        <input type="checkbox" checked={allSelected} onChange={toggleAll} id="bulk-all" />
        <label htmlFor="bulk-all" className="cursor-pointer text-muted">
          현재 페이지 전체 선택
        </label>
      </div>

      <div className="space-y-3">
        {orders.map((order) => {
          const draft = getDraft(order);
          return (
            <div key={order.id} className="border border-border p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={selected.has(order.id)}
                    onChange={() => toggleOne(order.id)}
                    aria-label={`${order.order_number ?? order.id} 선택`}
                  />
                  <Link href={`/admin/orders/${order.id}`} className="min-w-0 hover:underline">
                    <p className="text-sm font-medium">
                      {order.order_number ?? order.id.slice(0, 8)}
                    </p>
                    <p className="text-xs text-muted">
                      {order.customer_name} · {order.customer_email}
                    </p>
                    <p className="mt-1 text-[10px] text-muted">
                      {new Date(order.created_at).toLocaleString("ko-KR")}
                    </p>
                  </Link>
                </div>
                <div className="pl-7 text-right text-sm sm:pl-0">
                  <p>{orderStatusLabel(order.status)}</p>
                  <p className="text-xs text-muted">
                    {order.total?.toLocaleString()} {order.currency}
                  </p>
                </div>
              </div>

              <div className="mt-3 grid gap-3 border-t border-border pt-3 lg:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[10px] uppercase tracking-widest text-muted">
                    관리자 메모
                  </label>
                  <div className="flex gap-2">
                    <input
                      value={draft.admin_memo}
                      onChange={(e) => updateDraft(order.id, { admin_memo: e.target.value })}
                      className="min-w-0 flex-1 border border-border px-3 py-2 text-sm outline-none focus:border-foreground"
                      placeholder="내부 메모"
                    />
                    <button
                      type="button"
                      disabled={savingId === `${order.id}:memo`}
                      onClick={() => void saveMemo(order)}
                      className="shrink-0 border border-border px-3 py-2 text-[10px] uppercase tracking-widest disabled:opacity-50"
                    >
                      저장
                    </button>
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-[10px] uppercase tracking-widest text-muted">
                    택배 · 송장
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <select
                      value={draft.tracking_courier}
                      onChange={(e) =>
                        updateDraft(order.id, { tracking_courier: e.target.value })
                      }
                      className="border border-border px-3 py-2 text-sm outline-none focus:border-foreground"
                    >
                      <option value="">택배사</option>
                      {SHIPPING_COURIERS.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    <input
                      value={draft.tracking_number}
                      onChange={(e) =>
                        updateDraft(order.id, { tracking_number: e.target.value })
                      }
                      className="min-w-0 flex-1 border border-border px-3 py-2 text-sm outline-none focus:border-foreground"
                      placeholder="송장번호"
                    />
                    <button
                      type="button"
                      disabled={savingId === `${order.id}:ship`}
                      onClick={() => void saveShipping(order)}
                      className="shrink-0 border border-border px-3 py-2 text-[10px] uppercase tracking-widest disabled:opacity-50"
                    >
                      저장
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
