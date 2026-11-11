"use client";

import { useState } from "react";
import { THINK_REPORT_REASONS } from "@/lib/think";

export function ThinkReportButton({ postId }: { postId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>(THINK_REPORT_REASONS[0]);
  const [custom, setCustom] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const submit = async () => {
    setBusy(true);
    setMsg("");
    try {
      const finalReason = reason === "기타" ? custom.trim() || "기타" : reason;
      const res = await fetch(`/api/think/posts/${postId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: finalReason }),
      });
      const json = (await res.json()) as { message?: string };
      if (!res.ok) throw new Error(json.message || "신고 실패");
      setMsg(json.message || "신고가 접수되었습니다.");
      setOpen(false);
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : "신고 실패");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-xs text-muted underline hover:text-foreground"
      >
        신고
      </button>
      {msg ? <p className="mt-1 text-[11px] text-muted">{msg}</p> : null}
      {open ? (
        <div className="absolute right-0 z-20 mt-2 w-64 rounded-md border border-border bg-background p-3 shadow-lg">
          <p className="mb-2 text-xs font-medium">신고 사유</p>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="mb-2 w-full border border-border px-2 py-1.5 text-xs"
          >
            {THINK_REPORT_REASONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          {reason === "기타" ? (
            <input
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              placeholder="사유 입력"
              className="mb-2 w-full border border-border px-2 py-1.5 text-xs"
            />
          ) : null}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setOpen(false)} className="text-xs text-muted">
              취소
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void submit()}
              className="border border-foreground px-3 py-1 text-xs disabled:opacity-50"
            >
              {busy ? "…" : "신고하기"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
