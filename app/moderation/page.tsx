import { ModerationScreen } from "@/features/moderation/moderation-screen";
import { SupabaseModerationScreen } from "@/features/moderation/supabase-moderation-screen";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export default function ModerationPage() {
  if (isSupabaseConfigured()) {
    return <SupabaseModerationScreen />;
  }

  return <ModerationScreen />;
}
