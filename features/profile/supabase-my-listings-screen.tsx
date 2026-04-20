"use client";

import * as React from "react";
import Link from "next/link";
import { Loader2, RotateCcw, Tag } from "lucide-react";
import type { Listing } from "@/lib/domain";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast";
import { useSupabaseSession } from "@/features/auth/components/use-supabase-session";
import { mapListing, type SupabaseListingRecord } from "@/lib/repositories/supabase/mappers";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
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

export function SupabaseMyListingsScreen() {
  const { toast } = useToast();
  const { loading: sessionLoading, user } = useSupabaseSession();
  const [loading, setLoading] = React.useState(true);
  const [listings, setListings] = React.useState<Listing[]>([]);

  const reload = React.useCallback(async () => {
    if (!user) {
      setListings([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    const { data, error } = await supabase
      .from("listings")
      .select("*, listing_images(*)")
      .eq("seller_id", user.id)
      .order("updated_at", { ascending: false })
      .returns<SupabaseListingRecord[]>();

    if (error) {
      toast({ title: "Не удалось загрузить объявления", description: error.message });
    } else {
      setListings(data.map(mapListing));
    }

    setLoading(false);
  }, [toast, user]);

  React.useEffect(() => {
    if (!sessionLoading) {
      void reload();
    }
  }, [reload, sessionLoading]);

  async function resubmit(listingId: string) {
    const supabase = createSupabaseBrowserClient();
    const { error: listingError } = await supabase
      .from("listings")
      .update({ status: "pending", moderation_note: null })
      .eq("id", listingId);

    if (listingError) {
      toast({ title: "Не удалось отправить", description: listingError.message });
      return;
    }

    const { error: moderationError } = await supabase.from("moderation_cases").insert({
      listing_id: listingId,
      status: "open",
      note: "Повторная отправка на модерацию."
    });

    if (moderationError) {
      toast({ title: "Модерация не создана", description: moderationError.message });
      return;
    }

    toast({ title: "Повторно отправлено", description: "Объявление ожидает проверки." });
    await reload();
  }

  async function markSold(listingId: string) {
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.from("listings").update({ status: "sold" }).eq("id", listingId);

    if (error) {
      toast({ title: "Не удалось отметить проданным", description: error.message });
      return;
    }

    toast({ title: "Статус обновлен", description: "Объявление отмечено как sold." });
    await reload();
  }

  if (sessionLoading || loading) {
    return (
      <Card className="bg-white/92">
        <CardContent className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Загружаю ваши объявления
        </CardContent>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card className="bg-white/92">
        <CardHeader>
          <CardTitle>Нужен вход</CardTitle>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/auth/sign-in?redirectTo=/profile/listings">Войти</Link>
          </Button>
        </CardContent>
      </Card>
    );
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
        <CardContent>
          <p className="text-sm text-muted-foreground">Данные загружаются из Supabase listings и listing_images.</p>
        </CardContent>
      </Card>

      <Tabs defaultValue="all">
        <TabsList className="flex h-auto flex-wrap justify-start">
          {groups.map((group) => (
            <TabsTrigger key={group.value} value={group.value}>{group.label}</TabsTrigger>
          ))}
        </TabsList>
        {groups.map((group) => {
          const items = group.value === "all" ? listings : listings.filter((listing) => listing.status === group.value);
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
                        {listing.moderationNote ? (
                          <p className="mt-2 text-sm text-muted-foreground">{listing.moderationNote}</p>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/listings/${listing.id}`}>Открыть</Link>
                        </Button>
                        {listing.status === "needs_changes" || listing.status === "draft" ? (
                          <Button size="sm" onClick={() => void resubmit(listing.id)}>
                            <RotateCcw className="h-4 w-4" />
                            На модерацию
                          </Button>
                        ) : null}
                        {listing.status !== "sold" ? (
                          <Button size="sm" variant="secondary" onClick={() => void markSold(listing.id)}>Продано</Button>
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
