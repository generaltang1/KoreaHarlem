import { AdminOrdersPipeline } from "@/components/admin/AdminOrdersPipeline";

export default async function AdminOrdersPendingPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; size?: string; q?: string }>;
}) {
  return <AdminOrdersPipeline stage="pending" searchParams={await searchParams} />;
}
