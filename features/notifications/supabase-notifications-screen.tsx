"use client";

import * as React from "react";
import Link from "next/link";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import type { Notification } from "@/lib/domain";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import {
  fetchSupabaseNotifications,
  markAllSupabaseNotificationsRead,
  markSupabaseNotificationRead,
  subscribeToSupabaseNotifications,
  type SupabaseNotificationsData
} from "@/features/notifications/lib/supabase-notifications";
import { formatRelativeDate } from "@/lib/utils/format";
import { notificationTypeLabel } from "@/lib/utils/labels";

export function SupabaseNotificationsScreen() {
  const { toast } = useToast();
  const [data, setData] = React.useState<SupabaseNotificationsData>({
    userId: null,
    notifications: []
  });
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);

    try {
      setData(await fetchSupabaseNotifications());
    } catch (error) {
      toast({
        title: "Уведомления не загрузились",
        description: error instanceof Error ? error.message : "Попробуйте еще раз."
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    void load();
  }, [load]);

  React.useEffect(() => {
    if (!data.userId) {
      return;
    }

    return subscribeToSupabaseNotifications(data.userId, (notification) => {
      setData((current) => ({
        ...current,
        notifications: [notification, ...current.notifications.filter((item) => item.id !== notification.id)]
      }));
      toast({ title: notification.title, description: notification.body });
    });
  }, [data.userId, toast]);

  const unreadCount = data.notifications.filter((notification) => !notification.readAt).length;

  async function markRead(notificationId: string) {
    setBusy(notificationId);

    try {
      const notification = await markSupabaseNotificationRead(notificationId);
      setData((current) => ({
        ...current,
        notifications: current.notifications.map((item) => (item.id === notification.id ? notification : item))
      }));
    } catch (error) {
      toast({
        title: "Статус не обновлен",
        description: error instanceof Error ? error.message : "Попробуйте еще раз."
      });
    } finally {
      setBusy(null);
    }
  }

  async function markAllRead() {
    if (!data.userId) {
      return;
    }

    setBusy("all");

    try {
      await markAllSupabaseNotificationsRead(data.userId);
      const readAt = new Date().toISOString();
      setData((current) => ({
        ...current,
        notifications: current.notifications.map((item) => ({ ...item, readAt: item.readAt ?? readAt }))
      }));
      toast({ title: "Все уведомления прочитаны" });
    } catch (error) {
      toast({
        title: "Не удалось прочитать все",
        description: error instanceof Error ? error.message : "Попробуйте еще раз."
      });
    } finally {
      setBusy(null);
    }
  }

  if (loading) {
    return (
      <Card className="bg-card/92">
        <CardContent className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Загружаю уведомления
        </CardContent>
      </Card>
    );
  }

  if (!data.userId) {
    return (
      <EmptyState
        title="Войдите, чтобы открыть уведомления"
        description="Уведомления о сообщениях, офферах и сделках доступны после входа."
        actionLabel="Войти"
        actionHref="/auth/sign-in?redirectTo=/notifications"
        icon={<Bell className="h-6 w-6" />}
      />
    );
  }

  return (
    <div className="grid gap-6">
      <Card className="bg-card/92">
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Уведомления
            </CardTitle>
            <Button variant="outline" disabled={busy === "all" || unreadCount === 0} onClick={markAllRead}>
              <CheckCheck className="h-4 w-4" />
              Прочитать все
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {unreadCount} новых событий по сообщениям, офферам, модерации и сделкам.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-3">
        {data.notifications.length ? (
          data.notifications.map((notification) => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              busy={busy}
              onMarkRead={markRead}
            />
          ))
        ) : (
          <EmptyState
            title="Уведомлений пока нет"
            description="Ответы на офферы, модерация, избранное и статусы сделок появятся здесь."
            icon={<Bell className="h-6 w-6" />}
          />
        )}
      </div>
    </div>
  );
}

function NotificationCard({
  notification,
  busy,
  onMarkRead
}: {
  notification: Notification;
  busy: string | null;
  onMarkRead: (notificationId: string) => void;
}) {
  return (
    <Card className={notification.readAt ? "bg-card/70" : "bg-card/95 shadow-soft"}>
      <CardContent className="grid gap-3 p-4 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={notification.readAt ? "muted" : "secondary"}>{notificationTypeLabel[notification.type]}</Badge>
            <span className="text-xs text-muted-foreground">{formatRelativeDate(notification.createdAt)}</span>
          </div>
          <h2 className="mt-2 font-semibold">{notification.title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{notification.body}</p>
        </div>
        <div className="flex gap-2">
          {notification.href ? (
            <Button asChild variant="outline" size="sm">
              <Link href={notification.href}>Открыть</Link>
            </Button>
          ) : null}
          {!notification.readAt ? (
            <Button size="sm" disabled={busy === notification.id} onClick={() => onMarkRead(notification.id)}>
              Прочитано
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
