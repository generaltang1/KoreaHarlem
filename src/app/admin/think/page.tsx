import Link from "next/link";
import { AdminThinkList } from "@/components/admin/AdminThinkList";

export default function AdminThinkPage() {
  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted">Admin</p>
          <h1 className="mt-1 text-xl font-semibold">THINK 게시판 관리</h1>
        </div>
        <Link
          href="/think/new"
          className="border border-foreground px-4 py-2 text-[10px] uppercase tracking-widest"
        >
          글쓰기 (공지 가능)
        </Link>
      </div>
      <AdminThinkList />
    </div>
  );
}
