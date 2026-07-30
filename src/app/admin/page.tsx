import Link from "next/link";

const menus = [
  { label: "아티스트 관리", href: "/admin/artists", desc: "아티스트를 등록하고 수정/삭제합니다" },
  { label: "음악 관리", href: "/admin/music", desc: "등록된 아티스트를 선택한 뒤 앨범/수록곡을 등록합니다" },
  { label: "상품 관리", href: "/admin/products", desc: "SALE 상품을 등록·수정·삭제합니다" },
  { label: "주문 관리", href: "/admin/orders", desc: "주문 조회, 취소, 토스 환불 및 재고 복구" },
  { label: "작품 등록", href: "/admin/works/new", desc: "Explore용 작품을 등록합니다" },
  { label: "이벤트 등록", href: "/admin/events/new", desc: "이벤트를 등록합니다" },
];

export default function AdminPage() {
  return (
    <div>
      <div className="mb-10">
        <p className="text-[10px] uppercase tracking-widest text-muted">Dashboard</p>
        <h1 className="mt-1 text-2xl font-medium uppercase tracking-wider">관리자</h1>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {menus.map((menu) => (
          <Link
            key={menu.href}
            href={menu.href}
            className="group border border-border p-6 transition-colors hover:border-foreground"
          >
            <p className="text-sm font-medium uppercase tracking-wider">{menu.label}</p>
            <p className="mt-2 text-xs text-muted">{menu.desc}</p>
            <p className="mt-4 text-[10px] uppercase tracking-widest text-muted transition-colors group-hover:text-foreground">
              등록하기 →
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
