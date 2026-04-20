"use client";

import * as React from "react";
import Link from "next/link";
import { CheckCircle2, Loader2, PackageCheck, ShieldCheck, Truck } from "lucide-react";
import type { Deal, DealStatus, ID } from "@/lib/domain";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import {
  advanceSupabaseDeal,
  fetchSupabaseDealsData,
  subscribeToSupabaseDeals,
  type SupabaseDealsData
} from "@/features/deals/lib/supabase-deals";
import { formatMoney, formatRelativeDate } from "@/lib/utils/format";
import { dealStatusLabel, dealTypeLabel } from "@/lib/utils/labels";

const nextStatuses: DealStatus[] = ["payment_pending", "reserved", "handoff_planned", "in_transit", "inspection", "completed"];

export function SupabaseDealsScreen() {
  const { toast } = useToast();
  const [data, setData] = React.useState<SupabaseDealsData>({
    userId: null,
    deals: [],
    listingsById: {}
  });
  const [loading, setLoading] = React.useState(true);
  const [busyDeal, setBusyDeal] = React.useState<string | null>(null);

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

  async function advance(dealId: ID, status: DealStatus) {
    setBusyDeal(`${dealId}:${status}`);

    try {
      const deal = await advanceSupabaseDeal(dealId, status);
      setData((current) => ({
        ...current,
        deals: upsertDeal(current.deals, deal)
      }));
      toast({
        title: "Статус обновлен",
        description: status === "completed" ? "Товар помечен как продан, сделка закрыта." : dealStatusLabel[status]
      });
      void load();
    } catch (error) {
      toast({
        title: "Статус не обновлен",
        description: error instanceof Error ? error.message : "Supabase вернул ошибку."
      });
    } finally {
      setBusyDeal(null);
    }
  }

  if (loading) {
    return (
      <Card className="bg-card/92">
        <CardContent className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Загружаю safe deals
        </CardContent>
      </Card>
    );
  }

  if (!data.userId) {
    return (
      <EmptyState
        title="Войдите, чтобы открыть сделки"
        description="Safe deal lifecycle привязан к покупателю и продавцу в Supabase."
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
        description="Safe deal создается из чата после принятого оффера."
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
            Safe deal / delivery
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm text-muted-foreground">
          <p>Supabase lifecycle: created → payment pending → reserved → handoff/transit/inspection → completed.</p>
          <p className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            Escrow остается state machine без реального платежного провайдера.
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
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={deal.status === "completed" ? "success" : deal.status === "cancelled" ? "danger" : "accent"}>
                      {dealStatusLabel[deal.status]}
                    </Badge>
                    <Badge variant="outline" className="bg-background">{dealTypeLabel[deal.type]}</Badge>
                  </div>
                  <h2 className="mt-3 text-xl font-bold">{listing?.title ?? "Сделка Pine"}</h2>
                  <p className="mt-1 text-2xl font-bold">{formatMoney(deal.amount)}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/chat/${deal.conversationId}`}>Открыть чат</Link>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/listings/${deal.listingId}`}>Открыть товар</Link>
                    </Button>
                  </div>
                  <div className="mt-4 grid gap-2 sm:grid-cols-3">
                    {nextStatuses.map((status) => (
                      <Button
                        key={status}
                        variant={status === deal.status ? "secondary" : "outline"}
                        size="sm"
                        disabled={busyDeal === `${deal.id}:${status}` || deal.status === "completed" || deal.status === "cancelled"}
                        onClick={() => advance(deal.id, status)}
                      >
                        {status === "completed" ? <CheckCircle2 className="h-4 w-4" /> : <Truck className="h-4 w-4" />}
                        {dealStatusLabel[status]}
                      </Button>
                    ))}
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={busyDeal === `${deal.id}:cancelled` || deal.status === "completed" || deal.status === "cancelled"}
                      onClick={() => advance(deal.id, "cancelled")}
                    >
                      Отменить
                    </Button>
                  </div>
                </div>
                <div className="grid content-start gap-3">
                  <p className="font-semibold">Timeline</p>
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
