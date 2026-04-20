import { ProfileScreen } from "@/features/profile/profile-screen";
import { SupabaseProfileScreen } from "@/features/profile/supabase-profile-screen";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export default function ProfilePage() {
  if (isSupabaseConfigured()) {
    return <SupabaseProfileScreen />;
  }

  return <ProfileScreen />;
}
