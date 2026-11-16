"use client";

import type { SizeGuideData } from "@/lib/sizeGuide";
import { site } from "@/lib/siteTheme";

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
      <button
        type="button"
        className="absolute inset-0 bg-black/70"
        aria-label="닫기"
        onClick={onClose}
      />
      <div
        className={`relative z-10 max-h-[85vh] w-full max-w-2xl overflow-auto p-6 ${site.glassModal} ${site.font}`}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-medium text-[#f4f1ea]">사이즈 가이드</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-xl leading-none text-[#a8a49b] hover:text-[#f4f1ea]"
            aria-label="닫기"
          >
            ×
          </button>
        </div>
        {title && <p className="mb-3 text-sm text-[#a8a49b]">{title}</p>}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm text-[#f4f1ea]">
            <tbody>
              {guide.rows.map((row, i) => (
                <tr
                  key={i}
                  className={
                    i === 0
                      ? "bg-[rgba(244,241,234,0.08)] font-medium"
                      : "border-t border-[rgba(244,241,234,0.12)]"
                  }
                >
                  {row.map((cell, j) => (
                    <td
                      key={j}
                      className="border border-[rgba(244,241,234,0.12)] px-3 py-2 text-center"
                    >
                      {cell || "—"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
