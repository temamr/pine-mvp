"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Filter, Search, SlidersHorizontal, Sparkles } from "lucide-react";
import type { Category, Listing, ListingCondition } from "@/lib/domain";
import { FadeIn } from "@/components/motion/fade-in";
import { Stagger, StaggerItem } from "@/components/motion/stagger";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { trackSupabaseAnalyticsEvent } from "@/features/analytics/lib/supabase-analytics";
import { ListingCard } from "@/features/listings/components/listing-card";
import { ListingQuickPreview } from "@/features/listings/components/listing-quick-preview";
import { fetchSupabaseCatalogData, toggleSupabaseFavorite } from "@/features/listings/lib/supabase-listings";
import { mockCategories } from "@/lib/mock/fixtures";
import { usePineStore } from "@/lib/mock/use-pine-store";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { conditionLabel } from "@/lib/utils/labels";

type SortMode = "relevance" | "newest" | "price_low" | "price_high";

const sortLabel: Record<SortMode, string> = {
  relevance: "Релевантность",
  newest: "Сначала новые",
  price_low: "Цена ниже",
  price_high: "Цена выше"
};

const conditions: ListingCondition[] = ["new", "like_new", "good", "fair", "for_parts"];

export function CatalogScreen() {
  const router = useRouter();
  const { toast } = useToast();
  const supabaseEnabled = isSupabaseConfigured();
  const mockListings = usePineStore((state) => state.listings);
  const toggleFavorite = usePineStore((state) => state.toggleFavorite);
  const startConversation = usePineStore((state) => state.startConversation);
  const [supabaseCategories, setSupabaseCategories] = React.useState<Category[]>([]);
  const [supabaseListings, setSupabaseListings] = React.useState<Listing[]>([]);
  const [supabaseLoading, setSupabaseLoading] = React.useState(supabaseEnabled);
  const [query, setQuery] = React.useState("");
  const [categoryId, setCategoryId] = React.useState<string>("all");
  const [sort, setSort] = React.useState<SortMode>("relevance");
  const [condition, setCondition] = React.useState<ListingCondition | "all">("all");
  const [maxPrice, setMaxPrice] = React.useState("");
  const [preview, setPreview] = React.useState<Listing | null>(null);
  const [loading, setLoading] = React.useState(false);
  const categories = supabaseEnabled ? supabaseCategories : mockCategories;
  const listings = supabaseEnabled ? supabaseListings : mockListings;

  React.useEffect(() => {
    if (!supabaseEnabled) {
      return;
    }

    let active = true;
    setSupabaseLoading(true);

    fetchSupabaseCatalogData()
      .then((data) => {
        if (!active) {
          return;
        }

        setSupabaseCategories(data.categories);
        setSupabaseListings(data.listings);
      })
      .catch((error) => {
        toast({
          title: "Не удалось загрузить каталог",
          description: error instanceof Error ? error.message : "Попробуйте обновить страницу."
        });
      })
      .finally(() => {
        if (active) {
          setSupabaseLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [supabaseEnabled, toast]);

  React.useEffect(() => {
    setLoading(true);
    const timeout = window.setTimeout(() => setLoading(false), 220);
    return () => window.clearTimeout(timeout);
  }, [query, categoryId, sort, condition, maxPrice]);

  const filteredListings = React.useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const max = maxPrice.trim() ? Number(maxPrice) || Number.POSITIVE_INFINITY : Number.POSITIVE_INFINITY;
    const result = listings.filter((listing) => {
      const visibleInCatalog = listing.status === "published" || listing.status === "reserved";
      const matchesQuery = normalized
        ? [listing.title, listing.description, listing.location.label].join(" ").toLowerCase().includes(normalized)
        : true;
      const matchesCategory = categoryId === "all" || listing.categoryId === categoryId;
      const matchesCondition = condition === "all" || listing.condition === condition;
      const matchesPrice = listing.price.amount <= max;

      return visibleInCatalog && matchesQuery && matchesCategory && matchesCondition && matchesPrice;
    });

    if (sort === "newest") {
      return result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }

    if (sort === "price_low") {
      return result.sort((a, b) => a.price.amount - b.price.amount);
    }

    if (sort === "price_high") {
      return result.sort((a, b) => b.price.amount - a.price.amount);
    }

    return result;
  }, [categoryId, condition, listings, maxPrice, query, sort]);

  React.useEffect(() => {
    if (!supabaseEnabled || query.trim().length < 2) {
      return;
    }

    const timeout = window.setTimeout(() => {
      void trackSupabaseAnalyticsEvent({
        name: "search_used",
        metadata: {
          query: query.trim(),
          results: filteredListings.length
        }
      });
    }, 700);

    return () => window.clearTimeout(timeout);
  }, [filteredListings.length, query, supabaseEnabled]);

  React.useEffect(() => {
    if (!supabaseEnabled) {
      return;
    }

    const hasFilters = categoryId !== "all" || condition !== "all" || sort !== "relevance" || maxPrice.trim() !== "";

    if (!hasFilters) {
      return;
    }

    void trackSupabaseAnalyticsEvent({
      name: "filters_applied",
      metadata: {
        categoryId,
        condition,
        sort,
        maxPrice: Number(maxPrice) || 0,
        results: filteredListings.length
      }
    });
  }, [categoryId, condition, filteredListings.length, maxPrice, sort, supabaseEnabled]);

  const recentlyViewed = listings.slice(0, 2);
  const recommendations = listings.filter((listing) => listing.status === "published").slice(0, 3);

  function handleStartChat(listingId: string) {
    if (supabaseEnabled) {
      toast({
        title: "Откройте объявление",
        description: "Из карточки товара можно перейти в диалог с продавцом."
      });
      router.push(`/listings/${listingId}`);
      return;
    }

    const conversationId = startConversation(listingId);
    if (conversationId) {
      router.push(`/chat/${conversationId}`);
    }
  }

  async function handleFavorite(listingId: string) {
    if (!supabaseEnabled) {
      toggleFavorite(listingId);
      return;
    }

    try {
      const result = await toggleSupabaseFavorite(listingId);

      if (result.requiresAuth) {
        router.push("/auth/sign-in?redirectTo=/");
        return;
      }

      setSupabaseListings((current) =>
        current.map((listing) =>
          listing.id === listingId ? { ...listing, isFavorite: result.isFavorite } : listing
        )
      );
      setPreview((current) =>
        current?.id === listingId ? { ...current, isFavorite: result.isFavorite } : current
      );
    } catch (error) {
      toast({
        title: "Не удалось обновить избранное",
        description: error instanceof Error ? error.message : "Попробуйте еще раз."
      });
    }
  }

  return (
    <div className="grid gap-8">
      <FadeIn className="rounded-lg border bg-white/88 p-5 shadow-soft md:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Badge variant="secondary">Каталог Pine</Badge>
            <h1 className="mt-3 text-3xl font-bold tracking-normal">Найдите вещь и договоритесь в чате</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              {supabaseEnabled
                ? "Поиск, фильтры, быстрый просмотр и избранное работают на реальных данных."
                : "Поиск, фильтры, быстрый просмотр и переход к диалогу уже готовы для сценариев каталога."}
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-[1fr_auto] lg:w-[34rem]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={query} onChange={(event) => setQuery(event.target.value)} className="pl-9" placeholder="iPhone, MacBook, RTX, PlayStation" />
            </div>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline">
                  <SlidersHorizontal className="h-4 w-4" />
                  Фильтры
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <SheetHeader>
                  <SheetTitle>Фильтры</SheetTitle>
                </SheetHeader>
                <div className="mt-6 grid gap-5">
                  <label className="grid gap-2 text-sm font-medium">
                    Максимальная цена
                    <Input value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} inputMode="numeric" />
                  </label>
                  <label className="grid gap-2 text-sm font-medium">
                    Состояние
                    <select
                      value={condition}
                      onChange={(event) => setCondition(event.target.value as ListingCondition | "all")}
                      className="h-11 rounded-lg border bg-background px-3 text-sm"
                    >
                      <option value="all">Любое</option>
                      {conditions.map((item) => (
                        <option key={item} value={item}>
                          {conditionLabel[item]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="grid gap-2 text-sm font-medium">
                    Сортировка
                    <select
                      value={sort}
                      onChange={(event) => setSort(event.target.value as SortMode)}
                      className="h-11 rounded-lg border bg-background px-3 text-sm"
                    >
                      {(Object.keys(sortLabel) as SortMode[]).map((item) => (
                        <option key={item} value={item}>
                          {sortLabel[item]}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <SheetFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setCategoryId("all");
                      setCondition("all");
                      setMaxPrice("");
                      setSort("relevance");
                    }}
                  >
                    Сбросить
                  </Button>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </FadeIn>

      <section className="grid gap-4">
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            className={categoryId === "all" ? "rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white" : "rounded-lg border bg-white px-3 py-2 text-sm font-semibold"}
            onClick={() => setCategoryId("all")}
          >
            Все
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              className={categoryId === category.id ? "shrink-0 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white" : "shrink-0 rounded-lg border bg-white px-3 py-2 text-sm font-semibold"}
              onClick={() => setCategoryId(category.id)}
            >
              {category.name}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">{filteredListings.length} объявлений</p>
          <Badge variant="outline" className="bg-white">
            {sortLabel[sort]}
          </Badge>
        </div>

        {loading || supabaseLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2].map((item) => (
              <Skeleton key={item} className="h-80" />
            ))}
          </div>
        ) : (
          <Stagger className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredListings.map((listing) => (
              <StaggerItem key={listing.id}>
                <ListingCard
                  listing={listing}
                  onFavoriteClick={handleFavorite}
                  onQuickPreview={setPreview}
                />
              </StaggerItem>
            ))}
          </Stagger>
        )}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="bg-white/92">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-primary" />
              Недавно смотрели
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {recentlyViewed.map((listing) => (
              <button
                key={listing.id}
                className="flex items-center justify-between rounded-lg border bg-background p-3 text-left hover:bg-white"
                onClick={() => setPreview(listing)}
              >
                <span className="font-semibold">{listing.title}</span>
                <span className="text-sm text-muted-foreground">{listing.location.label}</span>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-white/92">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Рекомендации
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {recommendations.map((listing) => (
              <button
                key={listing.id}
                className="flex items-center justify-between rounded-lg border bg-background p-3 text-left hover:bg-white"
                onClick={() => setPreview(listing)}
              >
                <span className="font-semibold">{listing.title}</span>
                <span className="text-sm text-muted-foreground">{listing.viewsCount} просмотров</span>
              </button>
            ))}
          </CardContent>
        </Card>
      </section>

      <ListingQuickPreview
        listing={preview}
        open={Boolean(preview)}
        onOpenChange={(open) => {
          if (!open) {
            setPreview(null);
          }
        }}
        onFavorite={handleFavorite}
        onStartChat={handleStartChat}
      />
    </div>
  );
}
