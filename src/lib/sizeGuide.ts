/** Size guide table: rows[0] = header (사이즈 + size labels), rows[1+] = measurements */
export interface SizeGuideData {
  rows: string[][];
}

export function parseSizeGuide(raw: unknown): SizeGuideData | null {
  if (!raw || typeof raw !== "object") return null;
  const rows = (raw as SizeGuideData).rows;
  if (!Array.isArray(rows) || rows.length === 0) return null;
  return {
    rows: rows.map((row) =>
      Array.isArray(row) ? row.map((cell) => String(cell ?? "")) : [],
    ),
  };
}

export function buildHeaderRow(sizes: string[]): string[] {
  return ["사이즈", ...sizes];
}

/** Sync first row with current sizes; preserve measurement rows. */
export function syncSizeGuideHeader(guide: SizeGuideData | null, sizes: string[]): SizeGuideData {
  const header = buildHeaderRow(sizes);
  const colCount = header.length;
  if (!guide || guide.rows.length === 0) {
    return { rows: [header] };
  }
  const rest = guide.rows.slice(1).map((row) => {
    const padded = [...row];
    while (padded.length < colCount) padded.push("");
    return padded.slice(0, colCount);
  });
  return { rows: [header, ...rest] };
}

export function emptySizeGuide(sizes: string[]): SizeGuideData {
  return { rows: [buildHeaderRow(sizes)] };
}
