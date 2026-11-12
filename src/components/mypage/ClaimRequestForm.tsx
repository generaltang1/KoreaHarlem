"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { canRequestCs, type CsRequestType } from "@/lib/csRequests";
import { createClient } from "@/lib/supabase/client";
import { mp } from "@/lib/mypageTheme";

export type ClaimItem = {
  id: string;
  product_id: string | null;
  title: string;
  size: string | null;
  quantity: number;
  unit_price: number;
  currency: string;
  image_url: string | null;
};

const REASONS = [
  { id: "change_mind", label: "단순 변심", desc: "사이즈·색상 등" },
  { id: "defect", label: "상품 불량", desc: "파손·오염 등" },
  { id: "wrong", label: "오배송", desc: "다른 상품·옵션" },
] as const;

const MAX_PHOTOS = 3;
const RETURN_FEE_KRW = 4000;

export function ClaimRequestForm({
  orderId,
  orderNumber,
  status,
  hasOpenRequest,
  items,
  guestPassword,
  backHref,
}: {
  orderId: string;
  orderNumber: string;
  status: string;
  hasOpenRequest: boolean;
  items: ClaimItem[];
  guestPassword?: string;
  backHref: string;
}) {
  const router = useRouter();
  const [type, setType] = useState<CsRequestType>("return");
  const [reasonPreset, setReasonPreset] = useState<(typeof REASONS)[number]["id"]>("change_mind");
  const [detail, setDetail] = useState("");
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>(
    items[0]?.id ? [items[0].id] : [],
  );
  const [exchangeSize, setExchangeSize] = useState("");
  const [sizeOptions, setSizeOptions] = useState<string[]>([]);
  const [photos, setPhotos] = useState<File[]>([]);
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedItems = useMemo(
    () => items.filter((i) => selectedItemIds.includes(i.id)),
    [items, selectedItemIds],
  );
  const primaryItem = selectedItems[0] ?? null;
  const refundEstimate = selectedItems.reduce((s, i) => s + i.unit_price * i.quantity, 0);
  const customerPaysReturnFee = type === "return" && reasonPreset === "change_mind";
  const needsPhotos = reasonPreset === "defect" || reasonPreset === "wrong";
  const photoPreviews = useMemo(
    () => photos.map((f) => ({ name: f.name, url: URL.createObjectURL(f) })),
    [photos],
  );

  useEffect(() => {
    return () => {
      photoPreviews.forEach((p) => URL.revokeObjectURL(p.url));
    };
  }, [photoPreviews]);

  useEffect(() => {
    if (type !== "exchange" || !primaryItem?.product_id) {
      setSizeOptions([]);
      setExchangeSize("");
      return;
    }
    const supabase = createClient();
    void supabase
      .from("products")
      .select("sizes")
      .eq("id", primaryItem.product_id)
      .maybeSingle()
      .then(({ data }) => {
        const sizes = ((data?.sizes as string[] | null) ?? []).filter(Boolean);
        const current = (primaryItem.size ?? "").trim().toLowerCase();
        const options = sizes.filter((s) => s.trim().toLowerCase() !== current);
        setSizeOptions(options.length > 0 ? options : sizes);
        setExchangeSize("");
      });
  }, [type, primaryItem?.product_id, primaryItem?.size]);

  if (!canRequestCs(status)) {
    return (
      <div className={`${mp.card} p-6 text-sm text-neutral-400`}>
        배송 완료(또는 배송 중) 후에만 교환·반품을 신청할 수 있습니다.
        <Link href={backHref} className="mt-4 block text-[#FEE500] underline">
          주문 상세로
        </Link>
      </div>
    );
  }

  if (hasOpenRequest) {
    return (
      <div className={`${mp.card} p-6 text-sm text-neutral-400`}>
        이미 처리 중인 교환·반품 요청이 있습니다.
        <Link href={backHref} className="mt-4 block text-[#FEE500] underline">
          주문 상세로
        </Link>
      </div>
    );
  }

  const toggleItem = (id: string) => {
    if (type === "exchange") {
      setSelectedItemIds([id]);
      return;
    }
    setSelectedItemIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const onPickPhotos = (files: FileList | null) => {
    if (!files) return;
    const next = [...photos, ...Array.from(files)].filter((f) => f.type.startsWith("image/"));
    setPhotos(next.slice(0, MAX_PHOTOS));
  };

  const handleSubmit = async () => {
    if (selectedItemIds.length === 0) {
      setError("상품을 선택해 주세요.");
      return;
    }
    const reasonText = [
      REASONS.find((r) => r.id === reasonPreset)?.label ?? "",
      detail.trim(),
    ]
      .filter(Boolean)
      .join(" — ");
    if (!reasonText) {
      setError("사유를 입력해 주세요.");
      return;
    }
    if (type === "exchange") {
      if (selectedItemIds.length !== 1) {
        setError("교환은 상품을 하나만 선택해 주세요.");
        return;
      }
      if (!exchangeSize.trim()) {
        setError("교환할 사이즈(옵션)를 선택해 주세요.");
        return;
      }
    }
    if (needsPhotos && photos.length < 1) {
      setError("불량·오배송은 증빙 사진을 1장 이상 첨부해 주세요.");
      return;
    }
    if (!confirmed) {
      setError("안내 사항 확인에 체크해 주세요.");
      return;
    }
    if (!confirm("요청을 접수할까요? 관리자 확인 후 처리됩니다.")) return;

    setLoading(true);
    setError("");
    try {
      const isGuest = !!guestPassword;
      const endpoint = isGuest
        ? `/api/orders/${orderId}/guest-cs-request`
        : `/api/orders/${orderId}/cs-request`;
      const attachmentMetas = photos.map((f) => ({ name: f.name, mimeType: f.type || "image/jpeg" }));
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(isGuest ? { password: guestPassword } : {}),
          type,
          reason: reasonText,
          reasonCode: reasonPreset,
          returnShippingFeeKrw: customerPaysReturnFee ? RETURN_FEE_KRW : 0,
          exchangeSize: type === "exchange" ? exchangeSize.trim() : undefined,
          orderItemId: selectedItemIds[0],
          attachments: needsPhotos ? attachmentMetas : [],
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "신청 실패");

      const uploads = (json.uploads ?? []) as {
        path: string;
        token: string;
        signedUrl: string;
        fileName: string;
        mimeType: string;
      }[];

      const supabase = createClient();
      for (let i = 0; i < uploads.length; i++) {
        const slot = uploads[i];
        const file = photos[i];
        if (!file) continue;
        const { error: upErr } = await supabase.storage
          .from("cs-claims")
          .uploadToSignedUrl(slot.path, slot.token, file, {
            contentType: slot.mimeType || file.type || "image/jpeg",
          });
        if (upErr) throw new Error(upErr.message || "사진 업로드에 실패했습니다.");
      }

      if (uploads.length > 0 && json.request?.id) {
        const fin = await fetch(`/api/orders/${orderId}/cs-request/${json.request.id}/attachments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...(isGuest ? { password: guestPassword } : {}),
            uploads: uploads.map((u) => ({
              path: u.path,
              fileName: u.fileName,
              mimeType: u.mimeType,
            })),
          }),
        });
        const finJson = await fin.json();
        if (!fin.ok) throw new Error(finJson.message || "첨부 저장 실패");
      }

      router.push(backHref);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "신청 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const netRefundEstimate = Math.max(
    0,
    refundEstimate - (customerPaysReturnFee ? RETURN_FEE_KRW : 0),
  );

  return (
    <div className="space-y-5">
      <p className={`text-sm ${mp.muted}`}>주문번호 {orderNumber}</p>

      <section className={`${mp.card} p-5`}>
        <h2 className="text-sm font-semibold">1. 무엇을 신청하나요?</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {(
            [
              { value: "exchange" as const, title: "교환", desc: "동일 상품 · 다른 사이즈" },
              { value: "return" as const, title: "반품 (환불)", desc: "회수 후 환불" },
            ] as const
          ).map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                setType(opt.value);
                if (opt.value === "exchange" && selectedItemIds.length > 1) {
                  setSelectedItemIds(selectedItemIds.slice(0, 1));
                }
              }}
              className={`rounded-[8px] border px-4 py-4 text-left transition-colors ${
                type === opt.value
                  ? "border-[#fbc201] bg-[rgba(251,194,1,0.08)]"
                  : "border-[rgba(244,241,234,0.12)] bg-[rgba(244,241,234,0.05)]"
              }`}
            >
              <p className="text-sm font-semibold">{opt.title}</p>
              <p className={`mt-1 text-xs ${mp.muted}`}>{opt.desc}</p>
            </button>
          ))}
        </div>
      </section>

      <section className={`${mp.card} p-5`}>
        <h2 className="text-sm font-semibold">2. 상품 선택</h2>
        <ul className="mt-3 space-y-2">
          {items.map((item) => {
            const checked = selectedItemIds.includes(item.id);
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => toggleItem(item.id)}
                  className={`flex w-full items-start gap-3 rounded-[8px] border px-3 py-3 text-left ${
                    checked
                      ? "border-[#fbc201] bg-[rgba(251,194,1,0.08)]"
                      : "border-[rgba(244,241,234,0.12)]"
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-[2px] border ${
                      checked
                        ? "border-[#fbc201] bg-[#FEE500] text-black"
                        : "border-[rgba(244,241,234,0.35)]"
                    }`}
                  >
                    {checked ? "✓" : ""}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{item.title}</span>
                    <span className={`mt-0.5 block text-xs ${mp.muted}`}>
                      {item.size ? `사이즈 ${item.size} · ` : ""}
                      {item.quantity}개 · ₩{item.unit_price.toLocaleString("ko-KR")}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        {type === "exchange" ? (
          <div className="mt-4">
            <label className={mp.label}>교환할 사이즈 (동일 상품 다른 옵션)</label>
            {sizeOptions.length === 0 ? (
              <p className={`text-xs ${mp.muted}`}>
                선택 가능한 다른 사이즈가 없습니다. 상품에 등록된 사이즈를 확인해 주세요.
              </p>
            ) : (
              <div className="mt-2 flex flex-wrap gap-2">
                {sizeOptions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setExchangeSize(s)}
                    className={`min-w-[48px] rounded-[6px] border px-3 py-2 text-sm ${
                      exchangeSize === s
                        ? "border-[#fbc201] bg-[#FEE500] text-black"
                        : "border-[rgba(244,241,234,0.12)] text-[#f4f1ea]"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
            {primaryItem?.size ? (
              <p className={`mt-2 text-xs ${mp.muted}`}>현재 주문 사이즈: {primaryItem.size}</p>
            ) : null}
          </div>
        ) : null}
      </section>

      <section className={`${mp.card} p-5`}>
        <h2 className="text-sm font-semibold">3. 사유</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {REASONS.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setReasonPreset(r.id)}
              className={`rounded-[8px] border px-3 py-3 text-left ${
                reasonPreset === r.id
                  ? "border-[#fbc201] bg-[rgba(251,194,1,0.08)]"
                  : "border-[rgba(244,241,234,0.12)] bg-[rgba(244,241,234,0.05)]"
              }`}
            >
              <p className="text-sm font-medium">{r.label}</p>
              <p className={`mt-1 text-xs ${mp.muted}`}>{r.desc}</p>
            </button>
          ))}
        </div>
        <div className="mt-4">
          <label className={mp.label}>상세 내용</label>
          <textarea
            className={`${mp.input} min-h-[100px]`}
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            placeholder="자세한 내용을 적어 주세요"
          />
        </div>

        {needsPhotos ? (
          <div className="mt-4">
            <label className={mp.label}>증빙 사진 (최대 {MAX_PHOTOS}장 · 필수)</label>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {photoPreviews.map((p, idx) => (
                <div
                  key={p.url}
                  className="relative aspect-square overflow-hidden rounded-[8px] border border-[rgba(244,241,234,0.12)]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.url} alt={p.name} className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setPhotos((prev) => prev.filter((_, i) => i !== idx))}
                    className="absolute right-1 top-1 rounded-[4px] bg-black/70 px-1.5 text-xs"
                  >
                    ×
                  </button>
                </div>
              ))}
              {photos.length < MAX_PHOTOS ? (
                <label className="flex aspect-square cursor-pointer items-center justify-center rounded-[8px] border border-dashed border-[rgba(244,241,234,0.25)] text-2xl text-[#6e6b65] hover:border-[#fbc201]">
                  +
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    multiple
                    onChange={(e) => {
                      onPickPhotos(e.target.files);
                      e.target.value = "";
                    }}
                  />
                </label>
              ) : null}
            </div>
          </div>
        ) : null}
      </section>

      <section className={`${mp.card} p-5`}>
        <h2 className="text-sm font-semibold">4. 회수 · 비용 안내</h2>
        <ul className={`mt-3 space-y-2 text-sm ${mp.muted}`}>
          <li>회수: 우체국 택배 방문 수거 (관리자 승인 후)</li>
          <li>
            반품 배송비:{" "}
            {customerPaysReturnFee
              ? `단순 변심 시 고객 부담 ₩${RETURN_FEE_KRW.toLocaleString("ko-KR")} (환불액에서 차감)`
              : needsPhotos
                ? "불량·오배송 시 판매자 부담"
                : type === "exchange"
                  ? "교환은 별도 안내"
                  : "—"}
          </li>
          <li>
            예상 환불액: ₩{netRefundEstimate.toLocaleString("ko-KR")}
            {customerPaysReturnFee
              ? ` (상품 ₩${refundEstimate.toLocaleString("ko-KR")} − 반품비 ₩${RETURN_FEE_KRW.toLocaleString("ko-KR")})`
              : ""}
          </li>
          <li>티켓 상품은 별도 환불 규정이 적용될 수 있습니다.</li>
        </ul>
      </section>

      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          className="mt-1"
        />
        <span>[필수] 위 내용과 반품 배송비 부담 기준을 확인했어요</span>
      </label>

      {error ? <p className="text-sm text-rose-400">{error}</p> : null}

      <div className="flex flex-wrap gap-3">
        <button type="button" disabled={loading} onClick={handleSubmit} className={mp.creamBtn}>
          {loading ? "접수 중..." : type === "exchange" ? "교환 신청하기" : "반품 신청하기"}
        </button>
        <Link href={backHref} className={mp.ghostBtn}>
          취소
        </Link>
      </div>

      <p className={`text-xs ${mp.muted}`}>
        진행: 신청 접수 → 관리자 승인 → 회수·검수 → 처리 완료
      </p>
    </div>
  );
}
