import { NotificationsScreen } from "@/features/notifications/notifications-screen";
import { SupabaseNotificationsScreen } from "@/features/notifications/supabase-notifications-screen";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export default function NotificationsPage() {
  if (isSupabaseConfigured()) {
    return <SupabaseNotificationsScreen />;
  }

  return <NotificationsScreen />;
}
