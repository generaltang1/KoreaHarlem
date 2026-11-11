import { AdminOrdersPipeline } from "@/components/admin/AdminOrdersPipeline";

export default async function AdminOrdersReadyPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; size?: string; q?: string }>;
}) {
  return <AdminOrdersPipeline stage="ready" searchParams={await searchParams} />;
}
