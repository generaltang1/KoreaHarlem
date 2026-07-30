import Link from "next/link";
import { ProductForm } from "@/components/admin/ProductForm";

export default function NewProductPage() {
  return (
    <div>
      <div className="mb-8 flex items-end justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted">Admin</p>
          <h1 className="mt-1 text-xl font-medium uppercase tracking-wider">상품 등록</h1>
          <p className="mt-2 text-xs text-muted">가격은 KRW 기준. 다른 통화는 환율로 표시/결제됩니다.</p>
        </div>
        <Link href="/admin/products" className="text-[10px] uppercase tracking-widest text-muted underline">
          목록으로
        </Link>
      </div>
      <ProductForm mode="create" />
    </div>
  );
}
