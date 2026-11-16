import { TICKET_CANCEL_REFUND_ROWS } from "@/lib/ticketMeta";

/** B-08 취소·환불 — 시안 표. 멜론/확인필요 문구 없음 */
export function TicketCancelRefund({ className = "" }: { className?: string }) {
  return (
    <section className={className}>
      <h3 className="mb-4 text-[15px] font-bold text-[#FEE500]">취소·환불</h3>
      <div className="overflow-hidden rounded-[8px] border border-[rgba(244,241,234,0.12)]">
        <table className="w-full text-left text-sm text-[#f4f1ea]">
          <thead>
            <tr className="bg-[rgba(244,241,234,0.06)] text-[11px] uppercase tracking-wider text-[#a8a49b]">
              <th className="px-4 py-3 font-medium">취소 시점</th>
              <th className="px-4 py-3 font-medium">취소 수수료</th>
            </tr>
          </thead>
          <tbody>
            {TICKET_CANCEL_REFUND_ROWS.map((row) => (
              <tr
                key={row.when}
                className="border-t border-[rgba(244,241,234,0.12)]"
              >
                <td className="px-4 py-3 text-[#a8a49b]">{row.when}</td>
                <td className="px-4 py-3 text-[#f4f1ea]">{row.fee}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function TicketReceiveNotice({ className = "" }: { className?: string }) {
  return (
    <div
      className={`space-y-2 rounded-[8px] border border-[rgba(244,241,234,0.12)] bg-[rgba(244,241,234,0.05)] px-4 py-3 text-[12px] leading-relaxed text-[#a8a49b] ${className}`}
    >
      <p>
        <span className="font-semibold text-[#f4f1ea]">수령</span>
        {" · "}
        실물 배송 없이 주문 정보로 입장을 확인해요. (배송비 없음)
      </p>
      <p>
        <span className="font-semibold text-[#f4f1ea]">취소·환불</span>
        {" · "}
        아래 규정을 확인해 주세요.
      </p>
    </div>
  );
}
