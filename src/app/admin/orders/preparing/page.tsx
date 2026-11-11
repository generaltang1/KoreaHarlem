import { AdminOrdersPipeline } from "@/components/admin/AdminOrdersPipeline";

export default async function AdminOrdersPreparingPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; size?: string; q?: string }>;
}) {
  return <AdminOrdersPipeline stage="preparing" searchParams={await searchParams} />;
}
