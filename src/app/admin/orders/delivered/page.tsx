import { AdminOrdersPipeline } from "@/components/admin/AdminOrdersPipeline";

export default async function AdminOrdersDeliveredPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; size?: string; q?: string }>;
}) {
  return <AdminOrdersPipeline stage="delivered" searchParams={await searchParams} />;
}
