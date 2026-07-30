export function calcShippingFee(
  subtotalKrw: number,
  shippingFeeKrw: number,
  freeThresholdKrw: number | null | undefined,
): number {
  if (freeThresholdKrw != null && freeThresholdKrw > 0 && subtotalKrw >= freeThresholdKrw) {
    return 0;
  }
  return shippingFeeKrw;
}

export function formatShippingLabel(
  shippingFeeKrw: number,
  freeThresholdKrw: number | null | undefined,
): string {
  const fee = shippingFeeKrw.toLocaleString("ko-KR");
  if (freeThresholdKrw != null && freeThresholdKrw > 0) {
    return `${fee}원 (${freeThresholdKrw.toLocaleString("ko-KR")}원 이상 구매 시 무료)`;
  }
  return `${fee}원`;
}
