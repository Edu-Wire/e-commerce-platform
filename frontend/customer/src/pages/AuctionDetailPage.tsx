import { Navigate, useParams } from 'react-router-dom';

/** Legacy route — auction details live inside the live-auction layout. */
export default function AuctionDetailPage() {
  const { id } = useParams<{ id: string }>();
  if (!id) return <Navigate to="/live-auction" replace />;
  return <Navigate to={`/live-auction/${id}`} replace />;
}
