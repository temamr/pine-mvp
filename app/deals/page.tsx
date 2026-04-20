import { DealsScreen } from "@/features/deals/deals-screen";
import { SupabaseDealsScreen } from "@/features/deals/supabase-deals-screen";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export default function DealsPage() {
  if (isSupabaseConfigured()) {
    return <SupabaseDealsScreen />;
  }

  return <DealsScreen />;
}
