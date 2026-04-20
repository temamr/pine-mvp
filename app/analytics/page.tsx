import { AnalyticsScreen } from "@/features/analytics/analytics-screen";
import { SupabaseAnalyticsScreen } from "@/features/analytics/supabase-analytics-screen";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export default function AnalyticsPage() {
  if (isSupabaseConfigured()) {
    return <SupabaseAnalyticsScreen />;
  }

  return <AnalyticsScreen />;
}
