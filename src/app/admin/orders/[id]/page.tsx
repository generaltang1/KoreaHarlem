import { AdminOrderDetail } from "@/components/admin/AdminOrderDetail";

interface AdminOrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminOrderDetailPage({ params }: AdminOrderDetailPageProps) {
  const { id } = await params;
  return <AdminOrderDetail orderId={id} />;
}
