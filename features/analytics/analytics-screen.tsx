"use client";

import type React from "react";

import { BarChart3, MessageCircle, PackageCheck, Tag } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePineStore } from "@/lib/mock/use-pine-store";

export function AnalyticsScreen() {
  const listings = usePineStore((state) => state.listings);
  const conversations = usePineStore((state) => state.conversations);
  const offers = usePineStore((state) => state.offers);
  const deals = usePineStore((state) => state.deals);
  const completedDeals = deals.filter((deal) => deal.status === "completed").length;
  const acceptedOffers = offers.filter((offer) => offer.status === "accepted").length;
  const viewToChat = listings.length ? Math.round((conversations.length / listings.length) * 100) : 0;
  const offerAcceptance = offers.length ? Math.round((acceptedOffers / offers.length) * 100) : 0;

  return (
    <div className="grid gap-6">
      <Card className="bg-white/92">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Метрики Pine
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Mock dashboard для воронки view → chat → offer → deal.</p>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        <Metric title="Завершенные сделки" value={completedDeals} icon={<PackageCheck className="h-5 w-5" />} />
        <Metric title="Начатые диалоги" value={conversations.length} icon={<MessageCircle className="h-5 w-5" />} />
        <Metric title="Офферы" value={offers.length} icon={<Tag className="h-5 w-5" />} />
        <Metric title="View → Chat" value={`${viewToChat}%`} icon={<BarChart3 className="h-5 w-5" />} />
      </div>

      <Card className="bg-white/92">
        <CardContent className="grid gap-4 p-5 md:grid-cols-3">
          <div className="rounded-lg border bg-background p-4">
            <p className="text-sm text-muted-foreground">Offer acceptance rate</p>
            <p className="mt-2 text-3xl font-bold">{offerAcceptance}%</p>
          </div>
          <div className="rounded-lg border bg-background p-4">
            <p className="text-sm text-muted-foreground">Time to first reaction</p>
            <p className="mt-2 text-3xl font-bold">18m</p>
          </div>
          <div className="rounded-lg border bg-background p-4">
            <p className="text-sm text-muted-foreground">First-pass moderation</p>
            <p className="mt-2 text-3xl font-bold">82%</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({ title, value, icon }: { title: string; value: number | string; icon: React.ReactNode }) {
  return (
    <Card className="bg-white/92">
      <CardContent className="p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">{icon}</div>
        <p className="mt-4 text-3xl font-bold">{value}</p>
        <p className="mt-1 text-sm text-muted-foreground">{title}</p>
      </CardContent>
    </Card>
  );
}
