import { parseTicketLineup, type TicketLineupItem } from "@/lib/ticketMeta";

type TicketEventInfoProps = {
  eventStartsAt?: string | null;
  eventEndsAt?: string | null;
  venue?: string | null;
  minorsAllowed?: boolean;
  lineup?: unknown;
  className?: string;
  /** 메인 등에서 물레방아 롤링 UI 사용 */
  rollingLineup?: boolean;
};

function formatEventRange(start?: string | null, end?: string | null) {
  if (!start && !end) return null;
  const fmt = (iso: string) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };
  if (start && end) return `${fmt(start)} — ${fmt(end)}`;
  return fmt((start || end)!);
}

function LineupRow({ row }: { row: TicketLineupItem }) {
  return (
    <div className="flex items-center justify-between rounded border border-neutral-800/60 bg-neutral-900/60 px-2.5 py-1 font-mono text-xs transition-colors hover:border-neutral-600">
      <span className="w-28 shrink-0 text-[11px] text-neutral-400">{row.time_label}</span>
      <div className="flex flex-grow items-center gap-2">
        {row.role ? (
          <span className="rounded bg-neutral-800 px-1.5 py-0.5 text-[9px] font-semibold text-neutral-300">
            {row.role}
          </span>
        ) : null}
        <span className="font-medium text-neutral-200">{row.artist_name}</span>
      </div>
    </div>
  );
}

export function TicketEventInfo({
  eventStartsAt,
  eventEndsAt,
  venue,
  minorsAllowed,
  lineup,
  className = "",
  rollingLineup = false,
}: TicketEventInfoProps) {
  const rows: TicketLineupItem[] = parseTicketLineup(lineup);
  const when = formatEventRange(eventStartsAt, eventEndsAt);
  if (!when && !venue && rows.length === 0) return null;

  return (
    <div className={`space-y-4 text-sm ${className}`}>
      <div className="grid gap-3 sm:grid-cols-2">
        {when && (
          <div className="rounded-sm border border-neutral-800 bg-neutral-900/50 p-3.5">
            <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-neutral-500">
              날짜 // Date
            </span>
            <p className="font-mono text-sm font-bold leading-snug text-white">{when}</p>
          </div>
        )}
        {venue && (
          <div className="rounded-sm border border-neutral-800 bg-neutral-900/50 p-3.5">
            <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-neutral-500">
              장소 // Venue
            </span>
            <p className="text-sm font-bold leading-snug text-white">{venue}</p>
          </div>
        )}
      </div>

      <div className="flex items-start gap-3 rounded-sm border border-neutral-700 bg-neutral-900/80 p-3.5 sm:items-center">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-white font-mono text-xs font-black text-black">
          {minorsAllowed ? "ALL" : "19+"}
        </div>
        <div className="space-y-0.5 font-mono">
          <p className="text-xs font-bold tracking-wide text-white">
            {minorsAllowed ? "전 연령 관람 가능" : "19세 이상 관람 가능 (미성년자 출입 금지)"}
          </p>
          {!minorsAllowed && (
            <p className="text-[11px] font-normal text-neutral-400">
              실물 신분증 필참 · 미지참 시 입장·환불 불가
            </p>
          )}
        </div>
      </div>

      {rows.length > 0 && (
        <div className="space-y-2.5 rounded-sm border border-neutral-800 bg-neutral-900/50 p-4">
          <div className="flex items-center justify-between border-b border-neutral-800/80 pb-2">
            <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-widest text-neutral-300">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
              <span>Line-up &amp; Timetable</span>
            </div>
            <span className="font-mono text-[10px] uppercase text-neutral-500">
              {rows.length} SETS
            </span>
          </div>

          {rollingLineup && rows.length > 1 ? (
            <div className="wheel-roll-container wheel-mask relative h-28 select-none overflow-hidden">
              <div className="wheel-roll-track space-y-1">
                {[...rows, ...rows].map((row, i) => (
                  <LineupRow key={`${row.time_label}-${row.artist_name}-${i}`} row={row} />
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              {rows.map((row, i) => (
                <LineupRow key={`${row.time_label}-${row.artist_name}-${i}`} row={row} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
