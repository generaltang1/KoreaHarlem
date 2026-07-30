"use client";

import { useEffect } from "react";
import type { SizeGuideData } from "@/lib/sizeGuide";
import { syncSizeGuideHeader } from "@/lib/sizeGuide";

interface SizeGuideEditorProps {
  enabled: boolean;
  onEnabledChange: (v: boolean) => void;
  sizes: string[];
  guide: SizeGuideData | null;
  onChange: (guide: SizeGuideData | null) => void;
}

export function SizeGuideEditor({
  enabled,
  onEnabledChange,
  sizes,
  guide,
  onChange,
}: SizeGuideEditorProps) {
  const sizeKey = sizes.join("|");
  const display = guide ?? syncSizeGuideHeader(null, sizes);
  const colCount = Math.max(1, sizes.length + 1);

  useEffect(() => {
    if (!enabled || !guide) return;
    const synced = syncSizeGuideHeader(guide, sizes);
    if (JSON.stringify(guide.rows[0]) !== JSON.stringify(synced.rows[0])) {
      onChange(synced);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sizeKey, enabled]);

  const setCell = (rowIdx: number, colIdx: number, value: string) => {
    if (!guide) return;
    const rows = guide.rows.map((row, ri) =>
      ri === rowIdx ? row.map((cell, ci) => (ci === colIdx ? value : cell)) : [...row],
    );
    onChange({ rows });
  };

  const addRow = () => {
    const base = guide ?? syncSizeGuideHeader(null, sizes);
    onChange({
      rows: [...base.rows, Array.from({ length: colCount }, () => "")],
    });
  };

  const removeRow = (rowIdx: number) => {
    if (!guide || rowIdx === 0) return;
    onChange({ rows: guide.rows.filter((_, i) => i !== rowIdx) });
  };

  const handleToggle = (checked: boolean) => {
    onEnabledChange(checked);
    if (checked) {
      onChange(syncSizeGuideHeader(guide, sizes));
    } else {
      onChange(null);
    }
  };

  const rows = enabled && guide ? guide.rows : display.rows;

  return (
    <div className="space-y-3 border border-border p-4">
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={enabled} onChange={(e) => handleToggle(e.target.checked)} />
        <span>사이즈 가이드 등록</span>
      </label>

      {enabled && guide && (
        <>
          <p className="text-[10px] text-muted">
            첫 행은 등록한 사이즈가 자동 반영됩니다. 아래 행은 측정 항목을 직접 입력하세요.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[320px] border-collapse text-xs">
              <tbody>
                {rows.map((row, rowIdx) => (
                  <tr key={rowIdx} className="border-b border-border">
                    {Array.from({ length: colCount }).map((_, colIdx) => (
                      <td key={colIdx} className="p-1">
                        <input
                          value={row[colIdx] ?? ""}
                          onChange={(e) => setCell(rowIdx, colIdx, e.target.value)}
                          readOnly={rowIdx === 0 && colIdx > 0}
                          className={`w-full min-w-[4rem] border border-border px-2 py-1.5 ${
                            rowIdx === 0 && colIdx > 0 ? "bg-neutral-100" : ""
                          }`}
                          placeholder={rowIdx === 0 && colIdx === 0 ? "사이즈" : ""}
                        />
                      </td>
                    ))}
                    <td className="p-1">
                      {rowIdx > 0 && (
                        <button
                          type="button"
                          onClick={() => removeRow(rowIdx)}
                          className="whitespace-nowrap text-[10px] text-rose-500 underline"
                        >
                          행삭제
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            type="button"
            onClick={addRow}
            className="border border-border px-3 py-1.5 text-[10px] uppercase tracking-widest"
          >
            행추가
          </button>
        </>
      )}
    </div>
  );
}
