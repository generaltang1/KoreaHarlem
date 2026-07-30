"use client";

import type { SizeGuideData } from "@/lib/sizeGuide";

interface SizeGuideModalProps {
  open: boolean;
  onClose: () => void;
  guide: SizeGuideData;
  title?: string;
}

export function SizeGuideModal({ open, onClose, guide, title }: SizeGuideModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-black/50" aria-label="닫기" onClick={onClose} />
      <div className="relative z-10 max-h-[85vh] w-full max-w-2xl overflow-auto bg-background p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-medium">사이즈 가이드</h2>
          <button type="button" onClick={onClose} className="text-xl leading-none text-muted" aria-label="닫기">
            ×
          </button>
        </div>
        {title && <p className="mb-3 text-sm text-muted">{title}</p>}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <tbody>
              {guide.rows.map((row, i) => (
                <tr key={i} className={i === 0 ? "bg-neutral-100 font-medium" : "border-t border-border"}>
                  {row.map((cell, j) => (
                    <td key={j} className="border border-border px-3 py-2 text-center">
                      {cell || "—"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-[10px] leading-relaxed text-muted">
          위 실측 사이즈는 단면 기준입니다. 측정 방법에 따라 1–2cm 오차가 있을 수 있습니다.
        </p>
      </div>
    </div>
  );
}
