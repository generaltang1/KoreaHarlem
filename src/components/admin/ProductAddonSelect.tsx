"use client";

import Image from "next/image";

interface AddonOption {
  id: string;
  title: string;
  price_krw: number;
  image_url: string | null;
  sizes: string[];
}

interface ProductAddonSelectProps {
  allProducts: AddonOption[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  excludeId?: string;
}

export function ProductAddonSelect({
  allProducts,
  selectedIds,
  onChange,
  excludeId,
}: ProductAddonSelectProps) {
  const candidates = allProducts.filter((p) => p.id !== excludeId);

  const toggle = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((x) => x !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  if (candidates.length === 0) {
    return <p className="text-xs text-muted">추가할 수 있는 다른 상품이 없습니다.</p>;
  }

  return (
    <div className="space-y-2 border border-border p-4">
      <p className="text-[10px] uppercase tracking-widest text-muted">추가구성상품 (선택)</p>
      <p className="text-[10px] text-muted">상품 상세에서 함께 구매할 수 있는 상품을 고릅니다.</p>
      <ul className="max-h-60 space-y-2 overflow-y-auto">
        {candidates.map((p) => (
          <li key={p.id}>
            <label className="flex cursor-pointer items-center gap-3 border border-border p-2 hover:border-foreground">
              <input
                type="checkbox"
                checked={selectedIds.includes(p.id)}
                onChange={() => toggle(p.id)}
              />
              <div className="relative h-10 w-10 shrink-0 bg-neutral-100">
                {p.image_url && (
                  <Image src={p.image_url} alt="" fill className="object-cover" />
                )}
              </div>
              <span className="min-w-0 flex-1 text-sm">
                {p.title}
                <span className="ml-2 text-xs text-muted">
                  ₩{p.price_krw.toLocaleString("ko-KR")}
                </span>
              </span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
