import Link from "next/link";
import type { ProductWithImages } from "@/lib/products";
import { getProductImages } from "@/lib/products";
import { TicketEventInfo } from "@/components/commerce/TicketEventInfo";

type HomeTicketProps = {
  ticket: ProductWithImages | null;
};

export function HomeTicket({ ticket }: HomeTicketProps) {
  if (!ticket) {
    return (
      <section
        id="ticket-section"
        className="border-b border-neutral-800 bg-[#0a0a0c] px-4 py-16 text-neutral-100 sm:px-8"
      >
        <div className="mx-auto max-w-[1720px]">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">
                Tickets
              </p>
              <h2 className="mt-1 text-3xl font-black uppercase">Ticket</h2>
            </div>
            <Link
              href="/sale?category=ticket"
              className="text-xs font-mono uppercase tracking-widest text-neutral-400 hover:text-white"
            >
              More →
            </Link>
          </div>
          <p className="mt-4 text-sm text-neutral-500">현재 예매 가능한 티켓이 없습니다.</p>
        </div>
      </section>
    );
  }

  const images = getProductImages(ticket);
  const cover = images[0];

  return (
    <section
      id="ticket-section"
      className="border-b border-neutral-800 bg-[#0a0a0c] px-4 py-16 text-neutral-100 sm:px-8 sm:py-24"
    >
      <div className="mx-auto max-w-[1720px]">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">
              Tickets // Live
            </p>
            <h2 className="mt-1 text-3xl font-black uppercase sm:text-5xl">Ticket</h2>
          </div>
          <Link
            href="/sale?category=ticket"
            className="text-xs font-mono uppercase tracking-widest text-neutral-400 hover:text-white"
          >
            More →
          </Link>
        </div>
        <div className="grid gap-0 overflow-hidden rounded-sm border border-neutral-800 lg:grid-cols-2">
          <div className="relative flex min-h-[320px] items-center justify-center bg-neutral-950 lg:min-h-full">
            {cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={cover}
                alt={ticket.title}
                className="h-auto max-h-[720px] w-full object-contain object-center"
              />
            ) : (
              <div className="flex h-full min-h-[320px] items-center justify-center text-neutral-600">
                No Image
              </div>
            )}
          </div>
          <div className="flex flex-col justify-between bg-neutral-950/80 p-6 sm:p-8">
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-black uppercase tracking-tight sm:text-3xl">
                  {ticket.title}
                </h3>
                {ticket.description && (
                  <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-neutral-400">
                    {ticket.description}
                  </p>
                )}
              </div>
              <TicketEventInfo
                eventStartsAt={ticket.event_starts_at}
                eventEndsAt={ticket.event_ends_at}
                venue={ticket.venue}
                minorsAllowed={ticket.minors_allowed}
                lineup={ticket.lineup}
                rollingLineup
              />
            </div>
            <div className="mt-8 flex flex-col gap-4 border-t border-neutral-800 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="font-mono text-lg font-bold">
                {ticket.price_krw.toLocaleString("ko-KR")}{" "}
                <span className="text-xs font-normal text-neutral-500">KRW</span>
              </p>
              <Link
                href={`/sale/${ticket.id}`}
                className="inline-flex items-center justify-center gap-2 bg-white px-8 py-3.5 text-sm font-bold text-black transition hover:bg-neutral-200"
              >
                예매하기
                <span aria-hidden>→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

