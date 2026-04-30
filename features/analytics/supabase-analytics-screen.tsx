"use client";

import * as React from "react";
import Link from "next/link";
import { BarChart3, Loader2, MessageCircle, PackageCheck, Tag } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import {
  fetchSupabaseAnalyticsDashboard,
  type AnalyticsDashboardMetrics
} from "@/features/analytics/lib/supabase-analytics";

const emptyMetrics: AnalyticsDashboardMetrics = {
  completedDealsCount: 0,
  startedConversationsCount: 0,
  listingViewsCount: 0,
  offersCount: 0,
  acceptedOffersCount: 0,
  viewToChatConversion: 0,
  chatToOfferConversion: 0,
  offerToDealConversion: 0,
  offerAcceptanceRate: 0,
  timeToFirstReactionMinutes: 0,
  firstPassModerationApprovalRate: 0
};

export function SupabaseAnalyticsScreen() {
  const { toast } = useToast();
  const [metrics, setMetrics] = React.useState<AnalyticsDashboardMetrics>(emptyMetrics);
  const [loading, setLoading] = React.useState(true);
  const [blocked, setBlocked] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    setBlocked(false);

    try {
      setMetrics(await fetchSupabaseAnalyticsDashboard());
    } catch (error) {
      const message = error instanceof Error ? error.message : "Попробуйте еще раз.";
      if (message.includes("not_allowed")) {
        setBlocked(true);
      } else {
        toast({
          title: "Метрики не загрузились",
          description: message
        });
      }
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <Card className="bg-card/92">
        <CardContent className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Загружаю продуктовые метрики
        </CardContent>
      </Card>
    );
  }

  if (blocked) {
    return (
      <EmptyState
        title="Нужна роль модератора или администратора"
        description="Раздел с метриками доступен только команде модерации и администраторам."
        actionLabel="Открыть профиль"
        actionHref="/profile"
        icon={<BarChart3 className="h-6 w-6" />}
      />
    );
  }

  return (
    <div className="grid gap-6">
      <Card className="bg-card/92">
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Метрики Pine
            </CardTitle>
            <Button variant="outline" onClick={() => load()}>
              Обновить
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Здесь собраны ключевые продуктовые метрики: просмотры, диалоги, офферы, сделки и качество модерации.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        <Metric title="Завершенные сделки" value={metrics.completedDealsCount} icon={<PackageCheck className="h-5 w-5" />} />
        <Metric title="Начатые диалоги" value={metrics.startedConversationsCount} icon={<MessageCircle className="h-5 w-5" />} />
        <Metric title="Офферы" value={metrics.offersCount} icon={<Tag className="h-5 w-5" />} />
        <Metric title="Просмотры объявлений" value={metrics.listingViewsCount} icon={<BarChart3 className="h-5 w-5" />} />
      </div>

      <Card className="bg-card/92">
        <CardContent className="grid gap-4 p-5 md:grid-cols-3">
          <MetricBlock title="Просмотр → Чат" value={`${metrics.viewToChatConversion}%`} />
          <MetricBlock title="Чат → Оффер" value={`${metrics.chatToOfferConversion}%`} />
          <MetricBlock title="Оффер → Сделка" value={`${metrics.offerToDealConversion}%`} />
          <MetricBlock title="Доля принятых офферов" value={`${metrics.offerAcceptanceRate}%`} />
          <MetricBlock title="До первой реакции" value={`${metrics.timeToFirstReactionMinutes} мин`} />
          <MetricBlock title="Одобрение с первого раза" value={`${metrics.firstPassModerationApprovalRate}%`} />
        </CardContent>
      </Card>

      <Card className="bg-card/92">
        <CardContent className="p-5 text-sm leading-6 text-muted-foreground">
          Метрики обновляются по просмотрам объявлений, начатым диалогам, офферам, сделкам, избранному и действиям модерации.
          Права доступа к этому разделу настраиваются в <Link href="/moderation" className="font-semibold text-primary">модерации</Link>.
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({ title, value, icon }: { title: string; value: number | string; icon: ReactNode }) {
  return (
    <Card className="bg-card/92">
      <CardContent className="p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">{icon}</div>
        <p className="mt-4 text-3xl font-bold">{value}</p>
        <p className="mt-1 text-sm text-muted-foreground">{title}</p>
      </CardContent>
    </Card>
  );
}

function MetricBlock({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-lg border bg-background p-4">
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
    </div>
  );
}
