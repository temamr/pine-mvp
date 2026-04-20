import { FavoritesScreen } from "@/features/favorites/favorites-screen";
import { SupabaseFavoritesScreen } from "@/features/favorites/supabase-favorites-screen";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export default function FavoritesPage() {
  if (isSupabaseConfigured()) {
    return <SupabaseFavoritesScreen />;
  }

  return <FavoritesScreen />;
}
