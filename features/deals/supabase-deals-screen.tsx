"use client";

import * as React from "react";
import Link from "next/link";
import { Loader2, PackageCheck, ShieldCheck } from "lucide-react";
import type { Deal } from "@/lib/domain";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import {
  fetchSupabaseDealsData,
  subscribeToSupabaseDeals,
  type SupabaseDealsData
} from "@/features/deals/lib/supabase-deals";
import { formatMoney, formatRelativeDate } from "@/lib/utils/format";
import { dealStatusLabel, dealTypeLabel } from "@/lib/utils/labels";

export function SupabaseDealsScreen() {
  const { toast } = useToast();
  const [data, setData] = React.useState<SupabaseDealsData>({
    userId: null,
    role: null,
    isStaff: false,
    deals: [],
    listingsById: {}
  });
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    setLoading(true);

    try {
      setData(await fetchSupabaseDealsData());
    } catch (error) {
      toast({
        title: "Сделки не загрузились",
        description: error instanceof Error ? error.message : "Supabase вернул ошибку."
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

    return subscribeToSupabaseDeals(data.userId, (deal) => {
      setData((current) => ({
        ...current,
        deals: upsertDeal(current.deals, deal)
      }));
    });
  }, [data.userId]);

  if (loading) {
    return (
      <Card className="bg-card/92">
        <CardContent className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Загружаю сделки
        </CardContent>
      </Card>
    );
  }

  if (!data.userId) {
    return (
      <EmptyState
        title="Войдите, чтобы открыть сделки"
        description="Отслеживание сделки доступно только авторизованным пользователям."
        actionLabel="Войти"
        actionHref="/auth/sign-in?redirectTo=/deals"
        icon={<PackageCheck className="h-6 w-6" />}
      />
    );
  }

  if (!data.deals.length) {
    return (
      <EmptyState
        title="Сделок пока нет"
        description="Сделка появляется после принятого оффера в чате."
        actionLabel="Открыть чат"
        actionHref="/chat"
        icon={<PackageCheck className="h-6 w-6" />}
      />
    );
  }

  return (
    <div className="grid gap-6">
      <Card className="bg-card/92">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PackageCheck className="h-5 w-5 text-primary" />
            Сделки
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm text-muted-foreground">
          <p>Здесь можно следить за ходом сделки и быстро возвращаться в чат.</p>
          <p className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            Все ключевые этапы фиксируются в истории, а действия сторон выполняются прямо из чата.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {data.deals.map((deal) => {
          const listing = data.listingsById[deal.listingId];

          return (
            <Card key={deal.id} className="bg-card/94">
              <CardContent className="grid gap-5 p-5 lg:grid-cols-[1fr_0.8fr]">
                <div>
                  {data.isStaff ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={deal.status === "completed" ? "success" : deal.status === "cancelled" ? "danger" : "accent"}>
                        {dealStatusLabel[deal.status]}
                      </Badge>
                      <Badge variant="outline" className="bg-background">{dealTypeLabel[deal.type]}</Badge>
                    </div>
                  ) : null}
                  <h2 className="mt-3 text-xl font-bold">{listing?.title ?? "Сделка Pine"}</h2>
                  <p className="mt-1 text-2xl font-bold">{formatMoney(deal.amount)}</p>
                  {!data.isStaff ? (
                    <p className="mt-3 text-sm text-muted-foreground">
                      {deal.status === "completed"
                        ? "Сделка завершена. Если все прошло хорошо, можно оставить отзыв."
                        : "Следите за обновлениями в чате: продавец подтверждает отправку, покупатель подтверждает завершение."}
                    </p>
                  ) : null}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/chat/${deal.conversationId}`}>Открыть чат</Link>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/listings/${deal.listingId}`}>Открыть товар</Link>
                    </Button>
                    {deal.status === "completed" ? (
                      <Button asChild size="sm">
                        <Link href={`/profile?tab=reviews&reviewDeal=${deal.id}`}>Оставить отзыв</Link>
                      </Button>
                    ) : null}
                  </div>
                </div>
                <div className="grid content-start gap-3">
                  <p className="font-semibold">{data.isStaff ? "История и статусы" : "История"}</p>
                  {deal.timeline.map((event) => (
                    <div key={event.id} className="rounded-lg border bg-background p-3">
                      <p className="font-semibold">{event.label}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{event.description}</p>
                      <p className="mt-2 text-xs text-muted-foreground">{formatRelativeDate(event.createdAt)}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function upsertDeal(deals: Deal[], deal: Deal) {
  const next = deals.some((item) => item.id === deal.id)
    ? deals.map((item) => (item.id === deal.id ? deal : item))
    : [deal, ...deals];

  return next.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}
