import { ListingDetailScreen } from "@/features/listings/components/listing-detail-screen";

export default function ListingDetailsPage({ params }: { params: { id: string } }) {
  return <ListingDetailScreen listingId={params.id} />;
}
