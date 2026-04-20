"use client";

import * as React from "react";
import Link from "next/link";
import { Archive, Heart, Loader2 } from "lucide-react";
import type { Listing } from "@/lib/domain";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast";
import { useSupabaseSession } from "@/features/auth/components/use-supabase-session";
import { ListingCard } from "@/features/listings/components/listing-card";
import { toggleSupabaseFavorite } from "@/features/listings/lib/supabase-listings";
import { mapListing, type SupabaseListingRecord } from "@/lib/repositories/supabase/mappers";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type FavoriteItem = {
  id: string;
  listingId: string;
  archivedAt?: string;
  priceChangedAt?: string;
  soldNotifiedAt?: string;
  listing: Listing;
};

export function SupabaseFavoritesScreen() {
  const { toast } = useToast();
  const { loading: sessionLoading, user } = useSupabaseSession();
  const [loading, setLoading] = React.useState(true);
  const [items, setItems] = React.useState<FavoriteItem[]>([]);

  const reload = React.useCallback(async () => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    const { data: favorites, error: favoritesError } = await supabase
      .from("favorites")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (favoritesError) {
      toast({ title: "Не удалось загрузить избранное", description: favoritesError.message });
      setLoading(false);
      return;
    }

    const listingIds = favorites.map((favorite) => favorite.listing_id);

    if (!listingIds.length) {
      setItems([]);
      setLoading(false);
      return;
    }

    const { data: listings, error: listingsError } = await supabase
      .from("listings")
      .select("*, listing_images(*)")
      .in("id", listingIds)
      .returns<SupabaseListingRecord[]>();

    if (listingsError) {
      toast({ title: "Не удалось загрузить товары", description: listingsError.message });
      setLoading(false);
      return;
    }

    const listingsById = new Map(listings.map((listing) => [listing.id, mapListing(listing)]));

    setItems(
      favorites.flatMap((favorite) => {
        const listing = listingsById.get(favorite.listing_id);

        return listing
          ? [
              {
                id: favorite.id,
                listingId: favorite.listing_id,
                archivedAt: favorite.archived_at ?? undefined,
                priceChangedAt: favorite.price_changed_at ?? undefined,
                soldNotifiedAt: favorite.sold_notified_at ?? undefined,
                listing: { ...listing, isFavorite: !favorite.archived_at }
              }
            ]
          : [];
      })
    );
    setLoading(false);
  }, [toast, user]);

  React.useEffect(() => {
    if (!sessionLoading) {
      void reload();
    }
  }, [reload, sessionLoading]);

  async function archive(listingId: string) {
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase
      .from("favorites")
      .update({ archived_at: new Date().toISOString() })
      .eq("user_id", user?.id ?? "")
      .eq("listing_id", listingId);

    if (error) {
      toast({ title: "Не удалось архивировать", description: error.message });
      return;
    }

    await reload();
  }

  async function toggleFavorite(listingId: string) {
    const result = await toggleSupabaseFavorite(listingId);

    if (result.requiresAuth) {
      return;
    }

    await reload();
  }

  if (sessionLoading || loading) {
    return (
      <Card className="bg-white/92">
        <CardContent className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Загружаю избранное
        </CardContent>
      </Card>
    );
  }

  if (!user) {
    return (
      <EmptyState
        title="Войдите, чтобы сохранять товары"
        description="Избранное хранится в Supabase и привязано к вашему профилю."
        actionLabel="Войти"
        actionHref="/auth/sign-in?redirectTo=/favorites"
      />
    );
  }

  const saved = items.filter((item) => !item.archivedAt);
  const archived = items.filter((item) => item.archivedAt);

  return (
    <div className="grid gap-6">
      <Card className="bg-white/92">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            Избранное
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Сохраненные товары загружаются из Supabase favorites.</p>
        </CardContent>
      </Card>

      <Tabs defaultValue="saved">
        <TabsList>
          <TabsTrigger value="saved">Сохраненные</TabsTrigger>
          <TabsTrigger value="archived">Архив</TabsTrigger>
        </TabsList>
        <TabsContent value="saved">
          {saved.length ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {saved.map((item) => (
                <div key={item.id} className="grid gap-2">
                  <ListingCard listing={item.listing} onFavoriteClick={toggleFavorite} />
                  <div className="flex items-center justify-between rounded-lg border bg-white p-2">
                    <div className="flex gap-2">
                      {item.priceChangedAt ? <Badge variant="warning">price changed</Badge> : null}
                      {item.soldNotifiedAt ? <Badge variant="muted">sold</Badge> : null}
                    </div>
                    <Button variant="outline" size="sm" onClick={() => void archive(item.listingId)}>
                      <Archive className="h-4 w-4" />
                      Архив
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="Пока пусто" description="Сохраняйте электронику из каталога, чтобы вернуться к ней позже." actionLabel="Открыть каталог" actionHref="/" />
          )}
        </TabsContent>
        <TabsContent value="archived">
          {archived.length ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {archived.map((item) => (
                <Card key={item.id} className="bg-white/92">
                  <CardContent className="p-4">
                    <Link href={`/listings/${item.listingId}`} className="font-semibold hover:text-primary">{item.listing.title}</Link>
                    <p className="mt-1 text-sm text-muted-foreground">В архиве</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState title="Архив пуст" description="Архив пригодится для товаров, за которыми уже не нужно следить." />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
