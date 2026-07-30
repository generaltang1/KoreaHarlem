import EditArtistPage from "./EditArtistPage";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminEditArtistRoute({ params }: PageProps) {
  const { id } = await params;
  return <EditArtistPage artistId={id} />;
}
