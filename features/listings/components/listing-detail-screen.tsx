"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Flag, Heart, ImageOff, MapPin, MessageCircle, ShieldCheck, Star, Tag } from "lucide-react";
import type { Listing, User } from "@/lib/domain";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { trackSupabaseListingView } from "@/features/analytics/lib/supabase-analytics";
import { createSupabaseOffer, loadSupabaseThread, startSupabaseConversation } from "@/features/chat/lib/supabase-chat";
import { ListingCard } from "@/features/listings/components/listing-card";
import { fetchSupabaseListingDetails, toggleSupabaseFavorite } from "@/features/listings/lib/supabase-listings";
import { createSupabaseComplaint } from "@/features/moderation/lib/supabase-moderation";
import { usePineStore, demoUsers } from "@/lib/mock/use-pine-store";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { STATUS_TONE } from "@/lib/theme";
import { formatMoney, formatRelativeDate } from "@/lib/utils/format";
import { conditionLabel, listingStatusLabel } from "@/lib/utils/labels";

export function ListingDetailScreen({ listingId }: { listingId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const supabaseEnabled = isSupabaseConfigured();
  const listings = usePineStore((state) => state.listings);
  const toggleFavorite = usePineStore((state) => state.toggleFavorite);
  const startConversation = usePineStore((state) => state.startConversation);
  const createOffer = usePineStore((state) => state.createOffer);
  const createComplaint = usePineStore((state) => state.createComplaint);
  const [imageIndex, setImageIndex] = React.useState(0);
  const [offerAmount, setOfferAmount] = React.useState("");
  const [offerMessage, setOfferMessage] = React.useState("Готов забрать сегодня, если цена подойдет.");
  const [complaintDetails, setComplaintDetails] = React.useState("");
  const [complaintTargetType, setComplaintTargetType] = React.useState<"listing" | "user">("listing");
  const [remoteListing, setRemoteListing] = React.useState<Listing | null>(null);
  const [remoteSeller, setRemoteSeller] = React.useState<User | null>(null);
  const [remoteSimilar, setRemoteSimilar] = React.useState<Listing[]>([]);
  const [remoteLoading, setRemoteLoading] = React.useState(supabaseEnabled);
  const mockListing = listings.find((item) => item.id === listingId);
  const listing = supabaseEnabled ? remoteListing : mockListing;

  React.useEffect(() => {
    if (!supabaseEnabled) {
      return;
    }

    let active = true;
    setRemoteLoading(true);

    fetchSupabaseListingDetails(listingId)
      .then((data) => {
        if (!active) {
          return;
        }

        setRemoteListing(data?.listing ?? null);
        setRemoteSeller(data?.seller ?? null);
        setRemoteSimilar(data?.similar ?? []);

        if (data?.listing) {
          void trackSupabaseListingView(data.listing.id);
        }
      })
      .catch((error) => {
        toast({
          title: "Не удалось загрузить объявление",
          description: error instanceof Error ? error.message : "Попробуйте еще раз."
        });
      })
      .finally(() => {
        if (active) {
          setRemoteLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [listingId, supabaseEnabled, toast]);

  if (remoteLoading) {
    return (
      <Card className="bg-white/92">
        <CardContent className="p-6 text-sm text-muted-foreground">Загружаю объявление...</CardContent>
      </Card>
    );
  }

  if (!listing) {
    return (
      <Card className="bg-white/92">
        <CardHeader>
          <CardTitle>Объявление не найдено</CardTitle>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/">Вернуться в каталог</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const currentListing = listing;
  const seller = supabaseEnabled
    ? remoteSeller
    : demoUsers.find((user) => user.id === currentListing.sellerId);
  const activeImage = currentListing.images[imageIndex] ?? currentListing.images[0];
  const lowball = Number(offerAmount) > 0 && Number(offerAmount) < currentListing.price.amount * 0.75;
  const similarListings = supabaseEnabled
    ? remoteSimilar
    : listings.filter(
        (item) =>
          item.categoryId === currentListing.categoryId &&
          item.id !== currentListing.id &&
          (item.status === "published" || item.status === "reserved")
      );

  async function handleStartChat() {
    if (supabaseEnabled) {
      try {
        const conversationId = await startSupabaseConversation(currentListing.id);
        router.push(`/chat/${conversationId}`);
      } catch (error) {
        const description = error instanceof Error ? error.message : "Попробуйте еще раз.";

        toast({
          title: "Чат не создан",
          description
        });

        if (description.includes("Войдите")) {
          router.push(`/auth/sign-in?redirectTo=/listings/${currentListing.id}`);
        }
      }

      return;
    }

    const conversationId = startConversation(currentListing.id);
    if (conversationId) {
      router.push(`/chat/${conversationId}`);
    }
  }

  async function handleOffer() {
    if (supabaseEnabled) {
      const amount = Number(offerAmount);

      if (!Number.isFinite(amount) || amount <= 0) {
        toast({ title: "Укажите цену", description: "Оффер должен быть положительным числом." });
        return;
      }

      try {
        const conversationId = await startSupabaseConversation(currentListing.id);
        const thread = await loadSupabaseThread(conversationId);

        if (!thread.conversation) {
          throw new Error("Диалог не найден после создания.");
        }

        await createSupabaseOffer(thread.conversation, amount, offerMessage);
        toast({
          title: "Оффер отправлен",
          description: "Продавец увидит предложение в диалоге."
        });
        router.push(`/chat/${conversationId}`);
      } catch (error) {
        const description = error instanceof Error ? error.message : "Попробуйте еще раз.";

        toast({
          title: "Оффер не отправлен",
          description
        });

        if (description.includes("Войдите")) {
          router.push(`/auth/sign-in?redirectTo=/listings/${currentListing.id}`);
        }
      }

      return;
    }

    const conversationId = startConversation(currentListing.id);
    const offer = createOffer(conversationId, Number(offerAmount), offerMessage);
    if (offer) {
      toast({
        title: "Оффер отправлен",
        description: "Продавец увидит предложение в диалоге."
      });
      router.push(`/chat/${conversationId}`);
    }
  }

  async function handleComplaint() {
    if (supabaseEnabled) {
      if (!complaintDetails.trim()) {
        toast({ title: "Добавьте детали", description: "Модерации нужен короткий контекст." });
        return;
      }

      try {
        await createSupabaseComplaint({
          targetType: complaintTargetType,
          targetId: complaintTargetType === "listing" ? currentListing.id : currentListing.sellerId,
          reason: "other",
          details: complaintDetails
        });
        setComplaintDetails("");
        toast({ title: "Жалоба отправлена", description: "Мы проверим обращение." });
      } catch (error) {
        const description = error instanceof Error ? error.message : "Попробуйте еще раз.";

        toast({
          title: "Жалоба не отправлена",
          description
        });

        if (description.includes("Войдите")) {
          router.push(`/auth/sign-in?redirectTo=/listings/${currentListing.id}`);
        }
      }

      return;
    }

    if (!complaintDetails.trim()) {
      toast({ title: "Добавьте детали", description: "Модерации нужен короткий контекст." });
      return;
    }

    createComplaint({
      targetType: complaintTargetType,
      targetId: complaintTargetType === "listing" ? currentListing.id : currentListing.sellerId,
      reason: "other",
      details: complaintDetails
    });
    setComplaintDetails("");
    toast({ title: "Жалоба отправлена", description: "Статус появится в разделе модерации." });
  }

  async function handleFavorite(listingIdToToggle: string) {
    if (!supabaseEnabled) {
      toggleFavorite(listingIdToToggle);
      return;
    }

    try {
      const result = await toggleSupabaseFavorite(listingIdToToggle);

      if (result.requiresAuth) {
        router.push(`/auth/sign-in?redirectTo=/listings/${listingIdToToggle}`);
        return;
      }

      setRemoteListing((current) =>
        current?.id === listingIdToToggle ? { ...current, isFavorite: result.isFavorite } : current
      );
      setRemoteSimilar((current) =>
        current.map((item) =>
          item.id === listingIdToToggle ? { ...item, isFavorite: result.isFavorite } : item
        )
      );
    } catch (error) {
      toast({
        title: "Не удалось обновить избранное",
        description: error instanceof Error ? error.message : "Попробуйте еще раз."
      });
    }
  }

  return (
    <div className="grid gap-6 pb-20 md:pb-0">
      <div className="grid gap-6 lg:grid-cols-[1.12fr_0.88fr]">
        <section className="grid gap-3">
          <div className="relative aspect-[4/3] overflow-hidden rounded-lg border bg-muted shadow-soft">
            {activeImage ? (
              <Image src={activeImage.url} alt={activeImage.alt} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 55vw" priority />
            ) : (
              <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/10 via-secondary/30 to-background text-center text-muted-foreground">
                <div className="grid gap-2">
                  <ImageOff className="mx-auto h-10 w-10" />
                  <span className="text-sm font-medium">Изображение объявления пока недоступно</span>
                </div>
              </div>
            )}
            <div className="absolute left-3 top-3 flex gap-2">
              <Badge variant={STATUS_TONE[listing.status]}>{listingStatusLabel[listing.status]}</Badge>
              <Badge variant="outline" className="bg-white/90">{conditionLabel[listing.condition]}</Badge>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-4">
            {listing.images.map((image, index) => (
              <button
                key={image.id}
                className={index === imageIndex ? "relative aspect-[4/3] overflow-hidden rounded-lg ring-2 ring-primary" : "relative aspect-[4/3] overflow-hidden rounded-lg border"}
                onClick={() => setImageIndex(index)}
              >
                <Image src={image.url} alt={image.alt} fill className="object-cover" sizes="160px" />
              </button>
            ))}
          </div>
        </section>

        <aside className="grid content-start gap-4">
          <Card className="bg-white/94">
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-2xl leading-tight">{listing.title}</CardTitle>
                  <p className="mt-2 text-sm text-muted-foreground">{formatRelativeDate(listing.createdAt)}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => handleFavorite(listing.id)} aria-label="В избранное">
                  <Heart className={listing.isFavorite ? "h-5 w-5 fill-red-500 text-red-500" : "h-5 w-5"} />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4">
              <p className="text-3xl font-bold">{formatMoney(listing.price)}</p>
              <div className="grid gap-2 sm:grid-cols-2">
                <Button onClick={handleStartChat}>
                  <MessageCircle className="h-4 w-4" />
                  Написать
                </Button>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="secondary">
                      <Tag className="h-4 w-4" />
                      Предложить цену
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Оффер продавцу</DialogTitle>
                      <DialogDescription>Предложение появится в диалоге, где продавец сможет принять его, отклонить или ответить встречной ценой.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4">
                      <label className="grid gap-2 text-sm font-medium">
                        Ваша цена
                        <Input value={offerAmount} onChange={(event) => setOfferAmount(event.target.value)} inputMode="numeric" placeholder={`${listing.price.amount - 50}`} />
                      </label>
                      {lowball ? (
                        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-900">
                          Предложение заметно ниже цены. Мягкий старт часто повышает шанс ответа.
                        </div>
                      ) : null}
                      <label className="grid gap-2 text-sm font-medium">
                        Сообщение
                        <Textarea value={offerMessage} onChange={(event) => setOfferMessage(event.target.value)} />
                      </label>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleOffer}>Отправить оффер</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/94">
            <CardHeader>
              <CardTitle>Продавец</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">{seller?.displayName ?? "Продавец Pine"}</p>
                  <p className="text-sm text-muted-foreground">{seller?.completedDealsCount ?? 0} завершенных сделок</p>
                </div>
                <Badge variant="success">
                  <Star className="mr-1 h-3 w-3 fill-current" />
                  {seller?.rating ?? 4.8}
                </Badge>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-background p-3 text-sm text-muted-foreground">
                <ShieldCheck className="h-4 w-4 text-primary" />
                {seller?.verificationStatus === "trusted" ? "Проверенный продавец" : "Профиль подтвержден"}
              </div>
            </CardContent>
          </Card>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline">
                <Flag className="h-4 w-4" />
                Пожаловаться
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom">
              <SheetHeader>
                <SheetTitle>Жалоба</SheetTitle>
              </SheetHeader>
              <div className="mt-5 grid gap-3">
                <label className="grid gap-2 text-sm font-medium">
                  На что жалуетесь
                  <select
                    value={complaintTargetType}
                    onChange={(event) => setComplaintTargetType(event.target.value as "listing" | "user")}
                    className="h-11 rounded-lg border bg-background px-3 text-sm"
                  >
                    <option value="listing">На объявление</option>
                    <option value="user">На продавца</option>
                  </select>
                </label>
                <Textarea
                  value={complaintDetails}
                  onChange={(event) => setComplaintDetails(event.target.value)}
                  placeholder="Что стоит проверить модерации?"
                />
              </div>
              <SheetFooter>
                <Button onClick={handleComplaint}>Отправить</Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </aside>
      </div>

      <section className="grid gap-4 lg:grid-cols-[1fr_0.85fr]">
        <Card className="bg-white/92">
          <CardHeader>
            <CardTitle>Описание</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="leading-7 text-muted-foreground">{listing.description}</p>
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              {listing.attributes.map((attribute) => (
                <div key={attribute.label} className="rounded-lg border bg-background p-3">
                  <p className="text-xs text-muted-foreground">{attribute.label}</p>
                  <p className="font-semibold">{attribute.value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/92">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Локация
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="surface-grid flex h-56 items-center justify-center rounded-lg border bg-background">
              <div className="rounded-lg bg-white px-4 py-3 text-center shadow-soft">
                <p className="font-semibold">{listing.location.label}</p>
                <p className="text-sm text-muted-foreground">Map provider будет подключен позже</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4">
        <h2 className="text-2xl font-bold">Похожие товары</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {similarListings.map((item) => (
            <ListingCard key={item.id} listing={item} onFavoriteClick={handleFavorite} />
          ))}
        </div>
      </section>

      <div className="safe-bottom fixed inset-x-0 bottom-0 z-30 grid grid-cols-2 gap-2 border-t bg-white/95 p-3 backdrop-blur md:hidden">
        <Button variant="outline" onClick={() => handleFavorite(listing.id)}>
          <Heart className={listing.isFavorite ? "h-4 w-4 fill-red-500 text-red-500" : "h-4 w-4"} />
          Сохранить
        </Button>
        <Button onClick={handleStartChat}>
          <MessageCircle className="h-4 w-4" />
          Написать
        </Button>
      </div>
    </div>
  );
}
