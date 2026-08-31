/** 요청 헤더에서 클라이언트 IP 추출 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  return "0.0.0.0";
}

/** 비회원 표시용 IP 마스킹 — (110.98) 형식 */
export function maskIpForDisplay(ip: string): string {
  const ipv4 = ip.trim();
  const parts = ipv4.split(".");
  if (parts.length === 4 && parts.every((p) => /^\d{1,3}$/.test(p))) {
    return `(${parts[0]}.${parts[1]})`;
  }
  const colonParts = ipv4.split(":");
  if (colonParts.length >= 2) {
    return `(${colonParts[0]}:${colonParts[1]})`;
  }
  return "(??.??)";
}
