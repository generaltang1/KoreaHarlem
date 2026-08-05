interface OrderCancelRefundSectionProps {
  cancelReason?: string | null;
  cancelledAt?: string | null;
  refundedAt?: string | null;
  refundedAmount?: number | null;
  currency?: string;
}

export function OrderCancelRefundSection({
  cancelReason,
  cancelledAt,
  refundedAt,
  refundedAmount,
  currency,
}: OrderCancelRefundSectionProps) {
  if (!cancelReason && !refundedAt && !cancelledAt) return null;

  return (
    <section className="mt-8 border border-border p-5 text-sm">
      <h2 className="font-medium">취소/환불 정보</h2>
      {cancelReason && <p className="mt-2">사유: {cancelReason}</p>}
      {cancelledAt && (
        <p className="mt-1 text-muted">
          취소일: {new Date(cancelledAt).toLocaleString("ko-KR")}
        </p>
      )}
      {refundedAt && (
        <p className="mt-1 text-muted">
          환불일: {new Date(refundedAt).toLocaleString("ko-KR")}
          {refundedAmount != null && (
            <> · 환불액 {refundedAmount.toLocaleString("ko-KR")} {currency ?? "KRW"}</>
          )}
        </p>
      )}
    </section>
  );
}
