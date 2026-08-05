"use client";

import Link from "next/link";
import { ProductForm } from "@/components/admin/ProductForm";
import { StockAdjustPanel } from "@/components/admin/StockAdjustPanel";

interface EditProductPageProps {
  productId: string;
}

export function EditProductPage({ productId }: EditProductPageProps) {
  return (
    <div>
      <div className="mb-8 flex items-end justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted">Admin</p>
          <h1 className="mt-1 text-xl font-medium uppercase tracking-wider">상품 수정</h1>
          <p className="mt-2 text-xs text-muted">
            Cafe24형 재고 관리: 이 화면의 재고는 읽기 전용입니다. 재고 변경은 아래 「재고 수기 조정」
            (±수량·사유·이력)에서만 처리하세요.
          </p>
        </div>
        <Link href="/admin/products" className="text-[10px] uppercase tracking-widest text-muted underline">
          목록으로
        </Link>
      </div>
      <ProductForm mode="edit" productId={productId} />
      <StockAdjustPanel productId={productId} />
    </div>
  );
}
