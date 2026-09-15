import { AdminDjSetManager } from "@/components/admin/AdminDjSetManager";

export default function AdminDjSetPage() {
  return (
    <div>
      <div className="mb-8">
        <p className="text-[10px] uppercase tracking-widest text-muted">Admin</p>
        <h1 className="mt-1 text-xl font-medium uppercase tracking-wider">DJ SET 관리</h1>
        <p className="mt-2 text-xs text-muted">
          상단 고정 DJ SET 바에 재생될 음원을 등록합니다. 공개된 트랙이 순서대로 재생됩니다.
        </p>
      </div>
      <AdminDjSetManager />
    </div>
  );
}
