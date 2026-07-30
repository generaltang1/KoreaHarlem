"use client";

import Link from "next/link";
import { ProductForm } from "@/components/admin/ProductForm";

interface EditProductPageProps {
  productId: string;
}

export default function EditProductPage({ productId }: EditProductPageProps) {
  return (
    <div>
      <div className="mb-8 flex items-end justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted">Admin</p>
          <h1 className="mt-1 text-xl font-medium uppercase tracking-wider">상품 수정</h1>
        </div>
        <Link href="/admin/products" className="text-[10px] uppercase tracking-widest text-muted underline">
          목록으로
        </Link>
      </div>
      <ProductForm mode="edit" productId={productId} />
    </div>
  );
}
