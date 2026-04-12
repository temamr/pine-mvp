"use client";

import Link from "next/link";
import { Archive, Heart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ListingCard } from "@/features/listings/components/listing-card";
import { usePineStore } from "@/lib/mock/use-pine-store";

export function FavoritesScreen() {
  const favorites = usePineStore((state) => state.favorites);
  const listings = usePineStore((state) => state.listings);
  const toggleFavorite = usePineStore((state) => state.toggleFavorite);
  const archiveFavorite = usePineStore((state) => state.archiveFavorite);
  const saved = favorites.filter((favorite) => !favorite.archivedAt);
  const archived = favorites.filter((favorite) => favorite.archivedAt);

  function favoriteListings(items: typeof favorites) {
    return items
      .map((favorite) => ({
        favorite,
        listing: listings.find((listing) => listing.id === favorite.listingId)
      }))
      .filter((item): item is { favorite: typeof favorites[number]; listing: NonNullable<typeof item.listing> } => Boolean(item.listing));
  }

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
          <p className="text-sm text-muted-foreground">Сохраненные объявления, архив и сигналы об изменении цены или продаже.</p>
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
              {favoriteListings(saved).map(({ favorite, listing }) => (
                <div key={favorite.id} className="grid gap-2">
                  <ListingCard listing={listing} onFavoriteClick={toggleFavorite} />
                  <div className="flex items-center justify-between rounded-lg border bg-white p-2">
                    <div className="flex gap-2">
                      {favorite.priceChangedAt ? <Badge variant="warning">price changed</Badge> : null}
                      {favorite.soldNotifiedAt ? <Badge variant="muted">sold</Badge> : null}
                    </div>
                    <Button variant="outline" size="sm" onClick={() => archiveFavorite(listing.id)}>
                      <Archive className="h-4 w-4" />
                      Архив
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="Пока пусто" description="Сохраняйте объявления из каталога, чтобы вернуться к ним позже." actionLabel="Открыть каталог" actionHref="/" />
          )}
        </TabsContent>
        <TabsContent value="archived">
          {archived.length ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {favoriteListings(archived).map(({ favorite, listing }) => (
                <Card key={favorite.id} className="bg-white/92">
                  <CardContent className="p-4">
                    <Link href={`/listings/${listing.id}`} className="font-semibold hover:text-primary">{listing.title}</Link>
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
