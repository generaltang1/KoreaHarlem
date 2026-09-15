export type TicketLineupItem = {
  time_label: string;
  role?: string;
  artist_name: string;
};

export function parseTicketLineup(value: unknown): TicketLineupItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((row) => {
      if (!row || typeof row !== "object") return null;
      const r = row as Record<string, unknown>;
      const time_label = String(r.time_label ?? "").trim();
      const artist_name = String(r.artist_name ?? "").trim();
      if (!time_label && !artist_name) return null;
      const role = String(r.role ?? "").trim();
      return {
        time_label,
        artist_name,
        ...(role ? { role } : {}),
      };
    })
    .filter((x): x is TicketLineupItem => Boolean(x));
}
