"use client";

import type { ID, Notification } from "@/lib/domain";
import { mapNotification } from "@/lib/repositories/supabase/mappers";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/database.types";

export type SupabaseNotificationsData = {
  userId: ID | null;
  notifications: Notification[];
};

export async function fetchSupabaseNotifications(): Promise<SupabaseNotificationsData> {
  const client = createSupabaseBrowserClient();
  const {
    data: { user },
    error: authError
  } = await client.auth.getUser();

  if (authError) {
    throw authError;
  }

  if (!user) {
    return {
      userId: null,
      notifications: []
    };
  }

  const { data, error } = await client
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    throw error;
  }

  return {
    userId: user.id,
    notifications: data.map(mapNotification)
  };
}

export async function markSupabaseNotificationRead(notificationId: ID): Promise<Notification> {
  const client = createSupabaseBrowserClient();
  const { data, error } = await client
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return mapNotification(data);
}

export async function markAllSupabaseNotificationsRead(userId: ID): Promise<void> {
  const client = createSupabaseBrowserClient();
  const { error } = await client
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("read_at", null);

  if (error) {
    throw error;
  }
}

export function subscribeToSupabaseNotifications(userId: ID, onInsert: (notification: Notification) => void) {
  const client = createSupabaseBrowserClient();
  const channel = client
    .channel(`notifications:${userId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        onInsert(mapNotification(payload.new as Tables<"notifications">));
      }
    )
    .subscribe();

  return () => {
    void client.removeChannel(channel);
  };
}
