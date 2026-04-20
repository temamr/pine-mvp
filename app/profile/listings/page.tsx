import { MyListingsScreen } from "@/features/profile/my-listings-screen";
import { SupabaseMyListingsScreen } from "@/features/profile/supabase-my-listings-screen";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export default function MyListingsPage() {
  if (isSupabaseConfigured()) {
    return <SupabaseMyListingsScreen />;
  }

  return <MyListingsScreen />;
}
