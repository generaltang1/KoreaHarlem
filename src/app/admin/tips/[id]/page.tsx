import { AdminTipDetail } from "@/components/admin/AdminTipDetail";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminTipDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <AdminTipDetail tipId={id} />;
}
