import EditProductPage from "./EditProductPage";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminEditProductRoute({ params }: PageProps) {
  const { id } = await params;
  return <EditProductPage productId={id} />;
}
