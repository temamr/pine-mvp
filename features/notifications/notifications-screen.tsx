"use client";

import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePineStore } from "@/lib/mock/use-pine-store";
import { formatRelativeDate } from "@/lib/utils/format";
import { notificationTypeLabel } from "@/lib/utils/labels";

export function NotificationsScreen() {
  const notifications = usePineStore((state) => state.notifications);
  const markNotificationRead = usePineStore((state) => state.markNotificationRead);
  const markAllNotificationsRead = usePineStore((state) => state.markAllNotificationsRead);
  const unreadCount = notifications.filter((notification) => !notification.readAt).length;

  return (
    <div className="grid gap-6">
      <Card className="bg-white/92">
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Уведомления
            </CardTitle>
            <Button variant="outline" onClick={markAllNotificationsRead}>
              <CheckCheck className="h-4 w-4" />
              Прочитать все
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{unreadCount} новых событий по сообщениям, офферам, модерации и сделкам.</p>
        </CardContent>
      </Card>

      <div className="grid gap-3">
        {notifications.map((notification) => (
          <Card key={notification.id} className={notification.readAt ? "bg-white/70" : "bg-white/95 shadow-soft"}>
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
                  <Button size="sm" onClick={() => markNotificationRead(notification.id)}>Прочитано</Button>
                ) : null}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
