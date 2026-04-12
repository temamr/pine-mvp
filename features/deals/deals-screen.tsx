"use client";

import { CheckCircle2, PackageCheck, Truck } from "lucide-react";
import type { DealStatus } from "@/lib/domain";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { usePineStore } from "@/lib/mock/use-pine-store";
import { formatMoney, formatRelativeDate } from "@/lib/utils/format";
import { dealStatusLabel, dealTypeLabel } from "@/lib/utils/labels";

const nextStatuses: DealStatus[] = ["payment_pending", "reserved", "handoff_planned", "in_transit", "inspection", "completed"];

export function DealsScreen() {
  const { toast } = useToast();
  const deals = usePineStore((state) => state.deals);
  const listings = usePineStore((state) => state.listings);
  const advanceDeal = usePineStore((state) => state.advanceDeal);

  function advance(dealId: string, status: DealStatus) {
    advanceDeal(dealId, status);
    toast({ title: "Статус обновлен", description: dealStatusLabel[status] });
  }

  if (!deals.length) {
    return (
      <EmptyState
        title="Сделок пока нет"
        description="Safe deal создается из чата после договоренности по товару."
        actionLabel="Открыть чат"
        actionHref="/chat"
      />
    );
  }

  return (
    <div className="grid gap-6">
      <Card className="bg-white/92">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PackageCheck className="h-5 w-5 text-primary" />
            Safe deal / delivery
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Escrow пока mock state machine, но статусы и timeline уже расширяемы.</p>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {deals.map((deal) => {
          const listing = listings.find((item) => item.id === deal.listingId);
          return (
            <Card key={deal.id} className="bg-white/94">
              <CardContent className="grid gap-5 p-5 lg:grid-cols-[1fr_0.8fr]">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={deal.status === "completed" ? "success" : "accent"}>{dealStatusLabel[deal.status]}</Badge>
                    <Badge variant="outline" className="bg-white">{dealTypeLabel[deal.type]}</Badge>
                  </div>
                  <h2 className="mt-3 text-xl font-bold">{listing?.title ?? "Сделка Pine"}</h2>
                  <p className="mt-1 text-2xl font-bold">{formatMoney(deal.amount)}</p>
                  <div className="mt-4 grid gap-2 sm:grid-cols-3">
                    {nextStatuses.map((status) => (
                      <Button key={status} variant={status === deal.status ? "secondary" : "outline"} size="sm" onClick={() => advance(deal.id, status)}>
                        {status === "completed" ? <CheckCircle2 className="h-4 w-4" /> : <Truck className="h-4 w-4" />}
                        {dealStatusLabel[status]}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="grid gap-3">
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
