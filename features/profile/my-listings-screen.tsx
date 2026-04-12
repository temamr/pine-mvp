"use client";

import Link from "next/link";
import { RotateCcw, Tag } from "lucide-react";
import type { Listing } from "@/lib/domain";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast";
import { usePineStore } from "@/lib/mock/use-pine-store";
import { STATUS_TONE } from "@/lib/theme";
import { formatMoney } from "@/lib/utils/format";
import { listingStatusLabel } from "@/lib/utils/labels";

const groups: Array<{ value: Listing["status"] | "all"; label: string }> = [
  { value: "all", label: "Все" },
  { value: "draft", label: "Draft" },
  { value: "pending", label: "Pending" },
  { value: "published", label: "Published" },
  { value: "needs_changes", label: "Needs changes" },
  { value: "sold", label: "Sold" }
];

export function MyListingsScreen() {
  const { toast } = useToast();
  const currentUserId = usePineStore((state) => state.currentUserId);
  const listings = usePineStore((state) => state.listings);
  const resubmitListing = usePineStore((state) => state.resubmitListing);
  const markListingSold = usePineStore((state) => state.markListingSold);
  const mine = listings.filter((listing) => listing.sellerId === currentUserId);

  function resubmit(id: string) {
    resubmitListing(id);
    toast({ title: "Повторно отправлено", description: "Модерация увидит обновленное объявление." });
  }

  return (
    <div className="grid gap-6">
      <Card className="bg-white/92">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-primary" />
            Мои объявления
          </CardTitle>
        </CardHeader>
      </Card>

      <Tabs defaultValue="all">
        <TabsList className="flex h-auto flex-wrap justify-start">
          {groups.map((group) => (
            <TabsTrigger key={group.value} value={group.value}>{group.label}</TabsTrigger>
          ))}
        </TabsList>
        {groups.map((group) => {
          const items = group.value === "all" ? mine : mine.filter((listing) => listing.status === group.value);
          return (
            <TabsContent key={group.value} value={group.value}>
              <div className="grid gap-3">
                {items.map((listing) => (
                  <Card key={listing.id} className="bg-white/92">
                    <CardContent className="grid gap-3 p-4 md:grid-cols-[1fr_auto] md:items-center">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Link href={`/listings/${listing.id}`} className="font-semibold hover:text-primary">{listing.title}</Link>
                          <Badge variant={STATUS_TONE[listing.status]}>{listingStatusLabel[listing.status]}</Badge>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{formatMoney(listing.price)} · {listing.viewsCount} просмотров</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/listings/${listing.id}`}>Редактировать</Link>
                        </Button>
                        {listing.status === "needs_changes" || listing.status === "draft" ? (
                          <Button size="sm" onClick={() => resubmit(listing.id)}>
                            <RotateCcw className="h-4 w-4" />
                            На модерацию
                          </Button>
                        ) : null}
                        {listing.status === "pending" ? (
                          <Button asChild size="sm" variant="outline">
                            <Link href="/moderation">Промодерировать</Link>
                          </Button>
                        ) : null}
                        {listing.status !== "sold" ? (
                          <Button size="sm" variant="secondary" onClick={() => markListingSold(listing.id)}>Продано</Button>
                        ) : null}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
