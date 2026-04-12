"use client";

import Link from "next/link";
import type React from "react";
import { CheckCircle2, Heart, PackageCheck, Settings, ShieldCheck, Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePineStore, demoUsers } from "@/lib/mock/use-pine-store";
import { formatMoney } from "@/lib/utils/format";
import { dealStatusLabel } from "@/lib/utils/labels";

export function ProfileScreen() {
  const currentUserId = usePineStore((state) => state.currentUserId);
  const deals = usePineStore((state) => state.deals);
  const listings = usePineStore((state) => state.listings);
  const favorites = usePineStore((state) => state.favorites);
  const user = demoUsers.find((item) => item.id === currentUserId) ?? demoUsers[0];
  const myListings = listings.filter((listing) => listing.sellerId === currentUserId);
  const myDeals = deals.filter((deal) => deal.buyerId === currentUserId || deal.sellerId === currentUserId);

  return (
    <div className="grid gap-6">
      <Card className="bg-white/92">
        <CardContent className="grid gap-5 p-5 md:grid-cols-[auto_1fr_auto] md:items-center">
          <Avatar className="h-24 w-24">
            <AvatarImage src={user.avatarUrl} />
            <AvatarFallback>{user.displayName.slice(0, 2)}</AvatarFallback>
          </Avatar>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-bold">{user.displayName}</h1>
              <Badge variant="success">
                <ShieldCheck className="mr-1 h-3 w-3" />
                {user.verificationStatus}
              </Badge>
            </div>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{user.bio ?? "Покупатель Pine, который любит быстрые и понятные сделки."}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant="outline" className="bg-white">
                <Star className="mr-1 h-3 w-3 fill-current" />
                {user.rating} · {user.reviewsCount} отзывов
              </Badge>
              <Badge variant="outline" className="bg-white">{user.completedDealsCount} сделок</Badge>
            </div>
          </div>
          <Button asChild variant="outline">
            <Link href="/profile/listings">Мои объявления</Link>
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard icon={<PackageCheck className="h-5 w-5" />} label="Активные сделки" value={myDeals.length} />
        <MetricCard icon={<Heart className="h-5 w-5" />} label="Избранное" value={favorites.filter((favorite) => !favorite.archivedAt).length} />
        <MetricCard icon={<CheckCircle2 className="h-5 w-5" />} label="Мои объявления" value={myListings.length} />
      </div>

      <Tabs defaultValue="deals">
        <TabsList>
          <TabsTrigger value="deals">Сделки</TabsTrigger>
          <TabsTrigger value="reviews">Отзывы</TabsTrigger>
          <TabsTrigger value="settings">Настройки</TabsTrigger>
        </TabsList>
        <TabsContent value="deals">
          <div className="grid gap-3">
            {myDeals.map((deal) => (
              <Card key={deal.id} className="bg-white/92">
                <CardContent className="flex items-center justify-between gap-3 p-4">
                  <div>
                    <p className="font-semibold">{formatMoney(deal.amount)}</p>
                    <p className="text-sm text-muted-foreground">{dealStatusLabel[deal.status]}</p>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <Link href="/deals">Открыть</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="reviews">
          <Card className="bg-white/92">
            <CardContent className="p-5 text-sm leading-6 text-muted-foreground">
              “Быстро договорились, состояние совпало с описанием.”
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="settings">
          <Card className="bg-white/92">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                Уведомления
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              {["In-app notifications", "WhatsApp opt-in", "SMS opt-in"].map((item) => (
                <label key={item} className="flex items-center justify-between rounded-lg border bg-background p-3 text-sm font-medium">
                  {item}
                  <input type="checkbox" defaultChecked={item === "In-app notifications"} />
                </label>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MetricCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <Card className="bg-white/92">
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">{icon}</div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
