import { AdminOrdersPipeline } from "@/components/admin/AdminOrdersPipeline";

interface AdminOrdersPageProps {
  searchParams: Promise<{ page?: string; size?: string; q?: string; status?: string }>;
}

export default async function AdminOrdersPage({ searchParams }: AdminOrdersPageProps) {
  const params = await searchParams;
  // legacy ?status= 링크 호환 → 전용 경로로 유도하되 overview에서도 필터 가능하도록 overview 유지
  const stage =
    params.status === "pending"
      ? "pending"
      : params.status === "preparing"
        ? "preparing"
        : params.status === "ready" || params.status === "paid"
          ? "ready"
          : params.status === "shipped"
            ? "shipped"
            : params.status === "delivered"
              ? "delivered"
              : "overview";

  return <AdminOrdersPipeline stage={stage} searchParams={params} />;
}
