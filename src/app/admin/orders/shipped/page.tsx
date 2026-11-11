import { AdminOrdersPipeline } from "@/components/admin/AdminOrdersPipeline";

export default async function AdminOrdersShippedPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; size?: string; q?: string }>;
}) {
  return <AdminOrdersPipeline stage="shipped" searchParams={await searchParams} />;
}
