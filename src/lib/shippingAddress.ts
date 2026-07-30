export interface ShippingAddress {
  postcode: string;
  address: string;
  addressDetail: string;
  phone: string;
  message?: string;
}

export function formatShippingAddressText(addr: ShippingAddress): string {
  const parts = [
    addr.postcode ? `[${addr.postcode}]` : "",
    addr.address,
    addr.addressDetail,
    addr.phone ? `Tel: ${addr.phone}` : "",
  ].filter(Boolean);
  return parts.join(" ");
}

export function parseShippingAddress(raw: unknown): ShippingAddress | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.postcode === "string" || typeof o.address === "string") {
    return {
      postcode: String(o.postcode ?? ""),
      address: String(o.address ?? ""),
      addressDetail: String(o.addressDetail ?? o.detail ?? ""),
      phone: String(o.phone ?? ""),
      message: o.message ? String(o.message) : undefined,
    };
  }
  if (typeof o.address === "string" && !o.postcode) {
    return {
      postcode: "",
      address: o.address,
      addressDetail: "",
      phone: "",
    };
  }
  return null;
}
