import { Suspense } from "react";
import { ProfileScreen } from "@/features/profile/profile-screen";
import { SupabaseProfileScreen } from "@/features/profile/supabase-profile-screen";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export default function ProfilePage() {
  if (isSupabaseConfigured()) {
    return (
      <Suspense fallback={null}>
        <SupabaseProfileScreen />
      </Suspense>
    );
  }

  return <ProfileScreen />;
}
