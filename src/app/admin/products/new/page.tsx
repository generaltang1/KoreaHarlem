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
          <p className="mt-1 text-[10px] text-muted">
            여기서 입력하는 재고는 최초 1회만 절대값으로 저장됩니다. 등록 후에는 상품 수정 화면에서
            읽기 전용으로 표시되며, 이후 재고 변경은 「재고 수기 조정」에서 처리합니다 (Cafe24 방식).
          </p>
        </div>
        <Link href="/admin/products" className="text-[10px] uppercase tracking-widest text-muted underline">
          목록으로
        </Link>
      </div>
      <ProductForm mode="create" />
    </div>
  );
}
