import { PublicUserProfileScreen } from "@/features/profile/public-user-profile-screen";

export default function PublicUserProfilePage({ params }: { params: { id: string } }) {
  return <PublicUserProfileScreen userId={params.id} />;
}
