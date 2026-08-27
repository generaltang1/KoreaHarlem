"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { productCategoryLabel } from "@/lib/productCategories";

export interface AdminProductItem {
  id: string;
  title: string;
  price_krw: number;
  stock: number;
  category: string;
  subcategory: string | null;
  is_published: boolean;
  is_sale: boolean;
  show_stock?: boolean;
  created_at: string;
  image_url: string | null;
}

function DisplayStatusBadge({ published }: { published: boolean }) {
  return (
    <span
      className={
        published
          ? "inline-flex shrink-0 items-center border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-widest text-emerald-800"
          : "inline-flex shrink-0 items-center border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-widest text-neutral-600"
      }
    >
      {published ? "진열함" : "진열안함"}
    </span>
  );
}

function SaleStatusBadge({ onSale }: { onSale: boolean }) {
  return (
    <span
      className={
        onSale
          ? "inline-flex shrink-0 items-center border border-sky-200 bg-sky-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-widest text-sky-800"
          : "inline-flex shrink-0 items-center border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-widest text-amber-900"
      }
    >
      {onSale ? "판매함" : "판매안함"}
    </span>
  );
}

function StockDisplayBadge({ show }: { show: boolean }) {
  return (
    <span
      className={
        show
          ? "inline-flex shrink-0 items-center border border-violet-200 bg-violet-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-widest text-violet-800"
          : "inline-flex shrink-0 items-center border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-widest text-neutral-600"
      }
    >
      {show ? "재고표시" : "재고숨김"}
    </span>
  );
}

export function AdminProductsList({ products }: { products: AdminProductItem[] }) {
  const router = useRouter();
  const supabase = createClient();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`"${title}" 상품을 삭제할까요?`)) return;

    setError("");
    setDeletingId(id);

    const { error: deleteError } = await supabase.from("products").delete().eq("id", id);
    setDeletingId(null);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    router.refresh();
  };

  if (products.length === 0) {
    return (
      <div className="border border-border p-8 text-center">
        <p className="text-sm text-muted">등록된 상품이 없습니다.</p>
        <Link
          href="/admin/products/new"
          className="mt-4 inline-block text-xs uppercase tracking-widest underline"
        >
          첫 상품 등록하기
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-xs text-rose-500">{error}</p>}
      {products.map((product) => (
        <div
          key={product.id}
          className="flex flex-col gap-3 border border-border p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex min-w-0 items-center gap-4">
            <div className="relative h-14 w-14 shrink-0 overflow-hidden bg-neutral-100">
              {product.image_url ? (
                <Image src={product.image_url} alt={product.title} fill className="object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-[10px] text-muted">No img</div>
              )}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate text-sm font-medium">{product.title}</p>
                <DisplayStatusBadge published={product.is_published} />
                <SaleStatusBadge onSale={product.is_sale} />
                <StockDisplayBadge show={product.show_stock !== false} />
              </div>
              <p className="mt-0.5 text-xs text-muted">
                {productCategoryLabel(product.category, product.subcategory)} · ₩
                {product.price_krw.toLocaleString("ko-KR")} · 재고 {product.stock}
              </p>
              <p className="mt-1 text-[10px] text-muted">
                {new Date(product.created_at).toLocaleDateString("ko-KR")}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <Link
              href={`/admin/products/${product.id}/edit`}
              className="border border-border px-4 py-2 text-[10px] uppercase tracking-widest transition-colors hover:border-foreground"
            >
              수정
            </Link>
            <button
              type="button"
              onClick={() => handleDelete(product.id, product.title)}
              disabled={deletingId === product.id}
              className="border border-rose-200 px-4 py-2 text-[10px] uppercase tracking-widest text-rose-500 transition-colors hover:border-rose-500 disabled:opacity-50"
            >
              {deletingId === product.id ? "삭제 중..." : "삭제"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
