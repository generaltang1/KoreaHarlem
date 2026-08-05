"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { fetchSizeStockMap } from "@/lib/productSizeStock";
import { normalizeSize } from "@/lib/stock";
import {
  formatDelta,
  formatSizeLabel,
  type StockAdjustmentLog,
} from "@/lib/stockAdjust";

interface StockAdjustPanelProps {
  productId: string;
}

type SizeStockRow = { size: string; stock: number };

export function StockAdjustPanel({ productId }: StockAdjustPanelProps) {
  const [sizeKeys, setSizeKeys] = useState<string[]>([""]);
  const [stocks, setStocks] = useState<SizeStockRow[]>([]);
  const [logs, setLogs] = useState<StockAdjustmentLog[]>([]);
  const [size, setSize] = useState("");
  const [delta, setDelta] = useState("1");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [okMsg, setOkMsg] = useState("");

  const load = useCallback(async () => {
    setFetching(true);
    setError("");
    try {
      const supabase = createClient();
      const { data: product } = await supabase
        .from("products")
        .select("sizes")
        .eq("id", productId)
        .maybeSingle();

      const sizes = ((product?.sizes as string[] | null) ?? []).map(normalizeSize).filter(Boolean);
      const keys = sizes.length > 0 ? sizes : [""];
      setSizeKeys(keys);
      setSize((prev) => (keys.includes(prev) ? prev : keys[0] ?? ""));

      const map = await fetchSizeStockMap(supabase, productId);
      setStocks(keys.map((k) => ({ size: k, stock: map[k] ?? 0 })));

      const res = await fetch(`/api/admin/products/${productId}/stock-adjust`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "이력을 불러오지 못했습니다.");
      setLogs(json.logs ?? []);
      if (Array.isArray(json.stocks) && json.stocks.length > 0) {
        const fromApi = new Map(
          (json.stocks as SizeStockRow[]).map((r) => [normalizeSize(r.size), r.stock]),
        );
        setStocks(keys.map((k) => ({ size: k, stock: fromApi.get(k) ?? map[k] ?? 0 })));
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "불러오기 실패");
    } finally {
      setFetching(false);
    }
  }, [productId]);

  useEffect(() => {
    void load();
  }, [load]);

  const submit = async (sign: 1 | -1) => {
    const n = Number(delta);
    if (!Number.isInteger(n) || n <= 0) {
      setError("수량은 1 이상의 정수여야 합니다.");
      return;
    }
    if (!reason.trim()) {
      setError("조정 사유를 입력해주세요.");
      return;
    }

    const signed = sign * n;
    const label = sign > 0 ? `+${n}` : `-${n}`;
    if (!confirm(`재고를 ${label} 조정할까요?\n사이즈: ${formatSizeLabel(size)}\n사유: ${reason.trim()}`)) {
      return;
    }

    setLoading(true);
    setError("");
    setOkMsg("");
    try {
      const res = await fetch(`/api/admin/products/${productId}/stock-adjust`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ size, delta: signed, reason: reason.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "조정 실패");
      setOkMsg(`재고 ${formatDelta(signed)} 반영됨`);
      setReason("");
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "조정 실패");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mt-10 border border-border p-5">
      <h2 className="text-sm font-medium uppercase tracking-wider">재고 수기 조정</h2>
      <p className="mt-2 text-xs text-muted">
        Cafe24형 재고 관리: 신규 등록 이후 재고는 이 패널의 ±수량·사유로만 변경합니다. 위 상품 수정
        폼의 재고는 읽기 전용이며 저장 시 값이 바뀌지 않습니다. 실재고 불일치·수동 환불 후 복구 등에
        사용하고, 변경 이력이 아래에 남습니다.
      </p>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {stocks.map((row) => (
          <div key={row.size || "__default"} className="border border-border px-3 py-2 text-sm">
            <span className="text-muted">{formatSizeLabel(row.size)}</span>
            <span className="ml-2 font-medium">{row.stock}</span>
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-[10px] uppercase tracking-widest text-muted">사이즈</label>
          <select
            value={size}
            onChange={(e) => setSize(e.target.value)}
            className="w-full border border-border px-4 py-3 text-sm outline-none focus:border-foreground"
          >
            {sizeKeys.map((k) => (
              <option key={k || "__default"} value={k}>
                {formatSizeLabel(k)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-[10px] uppercase tracking-widest text-muted">수량</label>
          <input
            type="number"
            min={1}
            step={1}
            value={delta}
            onChange={(e) => setDelta(e.target.value)}
            className="w-full border border-border px-4 py-3 text-sm outline-none focus:border-foreground"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-[10px] uppercase tracking-widest text-muted">사유</label>
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="예: 수동 환불 후 재고 복구 / 실사 차이 보정"
            className="w-full border border-border px-4 py-3 text-sm outline-none focus:border-foreground"
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={loading || fetching}
          onClick={() => void submit(1)}
          className="border border-foreground bg-foreground px-4 py-2 text-[10px] uppercase tracking-widest text-background disabled:opacity-50"
        >
          + 증가
        </button>
        <button
          type="button"
          disabled={loading || fetching}
          onClick={() => void submit(-1)}
          className="border border-border px-4 py-2 text-[10px] uppercase tracking-widest disabled:opacity-50"
        >
          − 차감
        </button>
        <button
          type="button"
          disabled={fetching}
          onClick={() => void load()}
          className="border border-border px-4 py-2 text-[10px] uppercase tracking-widest text-muted disabled:opacity-50"
        >
          새로고침
        </button>
      </div>

      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      {okMsg ? <p className="mt-3 text-sm text-muted">{okMsg}</p> : null}

      <div className="mt-8">
        <h3 className="text-[10px] uppercase tracking-widest text-muted">조정 이력</h3>
        {fetching ? (
          <p className="mt-3 text-xs text-muted">불러오는 중…</p>
        ) : logs.length === 0 ? (
          <p className="mt-3 text-xs text-muted">이력이 없습니다.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border border border-border">
            {logs.map((log) => (
              <li key={log.id} className="px-3 py-3 text-sm">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span>
                    {formatSizeLabel(log.size)}{" "}
                    <span className="font-medium">{formatDelta(log.delta)}</span>
                    <span className="text-muted">
                      {" "}
                      ({log.stock_before} → {log.stock_after})
                    </span>
                  </span>
                  <time className="text-[10px] text-muted">
                    {new Date(log.created_at).toLocaleString("ko-KR")}
                  </time>
                </div>
                <p className="mt-1 text-xs text-muted">{log.reason}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
