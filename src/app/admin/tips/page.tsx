import { AdminTipsList } from "@/components/admin/AdminTipsList";

export default function AdminTipsPage() {
  return (
    <div>
      <div className="mb-8">
        <p className="text-[10px] uppercase tracking-widest text-muted">Admin</p>
        <h1 className="mt-1 text-xl font-medium uppercase tracking-wider">제보하기 관리</h1>
        <p className="mt-2 text-xs text-muted">Footer «제보하기»로 접수된 제보를 확인·삭제합니다.</p>
      </div>
      <AdminTipsList />
    </div>
  );
}
