"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, ShieldCheck, Star, UserRound } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { useSupabaseSession } from "@/features/auth/components/use-supabase-session";
import {
  createSupabaseReview,
  fetchSupabaseProfileTrustData,
  type SupabaseProfileTrustData
} from "@/features/profile/lib/supabase-profile";
import type { Review } from "@/lib/domain";
import { formatMoney, formatRelativeDate } from "@/lib/utils/format";

const reviewHighlights = ["Вежливое общение", "Быстрый выход на связь", "Честное описание", "Аккуратная упаковка", "Пунктуальность"];

export function SupabaseProfileScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { loading, user, profile } = useSupabaseSession();
  const [trustData, setTrustData] = React.useState<SupabaseProfileTrustData>({
    reviews: [],
    reviewableDeals: []
  });
  const [trustLoading, setTrustLoading] = React.useState(false);
  const [reviewText, setReviewText] = React.useState("Быстро договорились, сделка прошла спокойно.");
  const [reviewRating, setReviewRating] = React.useState<Review["rating"]>(5);
  const [reviewHighlightsState, setReviewHighlightsState] = React.useState<string[]>(["Вежливое общение"]);
  const [reviewBusy, setReviewBusy] = React.useState(false);

  React.useEffect(() => {
    if (!user) {
      return;
    }

    let active = true;
    setTrustLoading(true);

    fetchSupabaseProfileTrustData(user.id)
      .then((next) => {
        if (active) {
          setTrustData(next);
        }
      })
      .catch((error) => {
        toast({
          title: "Отзывы не загрузились",
          description: error instanceof Error ? error.message : "Попробуйте еще раз."
        });
      })
      .finally(() => {
        if (active) {
          setTrustLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [toast, user]);

  const reviewDealId = searchParams.get("reviewDeal");
  const tab = searchParams.get("tab") === "reviews" ? "reviews" : "account";
  const nextReviewDeal = trustData.reviewableDeals.find(
    (deal) => !deal.has_review && deal.id === reviewDealId && deal.recipient_id !== user?.id && deal.buyer_id !== deal.seller_id
  );

  async function submitReview() {
    if (!nextReviewDeal) {
      return;
    }

    if (!reviewText.trim()) {
      toast({ title: "Добавьте текст отзыва" });
      return;
    }

    setReviewBusy(true);

    try {
      await createSupabaseReview({
        dealId: nextReviewDeal.id,
        recipientId: nextReviewDeal.recipient_id,
        rating: reviewRating,
        text: [reviewHighlightsState.length ? `Что понравилось: ${reviewHighlightsState.join(", ")}` : "", reviewText]
          .filter(Boolean)
          .join("\n\n")
      });
      const next = user ? await fetchSupabaseProfileTrustData(user.id) : trustData;
      setTrustData(next);
      setReviewText("Быстро договорились, сделка прошла спокойно.");
      setReviewRating(5);
      setReviewHighlightsState(["Вежливое общение"]);
      toast({ title: "Отзыв сохранен", description: "Спасибо, ваша оценка уже учтена." });
    } catch (error) {
      toast({
        title: "Отзыв не сохранен",
        description: error instanceof Error ? error.message : "Попробуйте еще раз."
      });
    } finally {
      setReviewBusy(false);
    }
  }

  if (loading) {
    return (
      <Card className="bg-white/92">
        <CardContent className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Загружаю профиль
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
        <CardContent className="grid gap-4">
          <p className="text-sm text-muted-foreground">Войдите, чтобы открыть профиль Pine.</p>
          <Button asChild className="w-fit">
            <Link href="/auth/sign-in?redirectTo=/profile">Войти</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!profile) {
    return (
      <Card className="bg-white/92">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserRound className="h-5 w-5 text-primary" />
            Завершите профиль
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <p className="text-sm text-muted-foreground">
            Профиль еще не заполнен.
          </p>
          <Button className="w-fit" onClick={() => router.push("/onboarding")}>
            Заполнить профиль
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6">
      <Card className="bg-white/92">
        <CardContent className="grid gap-5 p-5 md:grid-cols-[auto_1fr_auto] md:items-center">
          <Avatar className="h-24 w-24">
            <AvatarImage src={profile.avatar_url ?? undefined} />
            <AvatarFallback>{profile.display_name.slice(0, 2)}</AvatarFallback>
          </Avatar>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-bold">{profile.display_name}</h1>
              <Badge variant="success">
                <ShieldCheck className="mr-1 h-3 w-3" />
                {profile.verification_status}
              </Badge>
            </div>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              {profile.bio ?? "Профиль готов к объявлениям, чатам и сделкам."}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant="outline" className="bg-white">
                <Star className="mr-1 h-3 w-3 fill-current" />
                {profile.rating} · {profile.reviews_count} отзывов
              </Badge>
              <Badge variant="outline" className="bg-white">{profile.completed_deals_count} сделок</Badge>
            </div>
          </div>
          <Button asChild variant="outline">
            <Link href="/onboarding">Редактировать</Link>
          </Button>
        </CardContent>
      </Card>

      <Tabs defaultValue={tab}>
        <TabsList className="flex h-auto flex-wrap justify-start">
            <TabsTrigger value="account">Аккаунт</TabsTrigger>
            <TabsTrigger value="security">Безопасность</TabsTrigger>
            <TabsTrigger value="reviews">Отзывы</TabsTrigger>
            <TabsTrigger value="settings">Настройки</TabsTrigger>
          </TabsList>
        <TabsContent value="account">
          <Card className="bg-white/92">
            <CardContent className="grid gap-3 p-5 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">ID пользователя</span>
                <span className="break-all font-medium">{user.id}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Email</span>
                <span className="font-medium">{profile.email ?? user.email ?? "Не указан"}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Роль</span>
                <span className="font-medium">{profile.role}</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="security">
            <Card className="bg-white/92">
              <CardContent className="p-5 text-sm leading-6 text-muted-foreground">
                Подтвержденный профиль, история сделок и отзывы помогают быстрее договариваться о покупке и продаже.
              </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="reviews">
          <div className="grid gap-3">
            {trustLoading ? (
              <Card className="bg-white/92">
                <CardContent className="flex items-center gap-2 p-5 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Загружаю отзывы
                </CardContent>
              </Card>
            ) : trustData.reviews.length ? (
              trustData.reviews.map((review) => (
                <Card key={review.id} className="bg-white/92">
                  <CardContent className="p-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="bg-white">
                        <Star className="mr-1 h-3 w-3 fill-current" />
                        {review.rating}
                      </Badge>
                      <span className="text-sm text-muted-foreground">{formatRelativeDate(review.createdAt)}</span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">{review.text}</p>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="bg-white/92">
                <CardContent className="p-5 text-sm leading-6 text-muted-foreground">
                  Отзывов пока нет. Оставить отзыв можно только после завершенной сделки с другим участником.
                </CardContent>
              </Card>
            )}

            {nextReviewDeal ? (
              <Card className="bg-white/92">
                <CardHeader>
                  <CardTitle>Оставить отзыв после сделки</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3">
                  <p className="text-sm text-muted-foreground">
                    Сделка на сумму {formatMoney({ amount: nextReviewDeal.amount, currency: nextReviewDeal.currency })} завершена. Теперь можно оценить вторую сторону.
                  </p>
                  <div className="grid gap-2 text-sm font-medium">
                    <span>Оценка</span>
                    <div className="flex flex-wrap gap-2">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <button
                          key={rating}
                          type="button"
                          onClick={() => setReviewRating(rating as Review["rating"])}
                          className="rounded-lg border px-3 py-2"
                        >
                          <span className="flex items-center gap-1 text-sm">
                            <Star className={rating <= reviewRating ? "h-4 w-4 fill-current text-primary" : "h-4 w-4 text-muted-foreground"} />
                            {rating}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid gap-2 text-sm font-medium">
                    <span>Что понравилось</span>
                    <div className="flex flex-wrap gap-2">
                      {reviewHighlights.map((item) => {
                        const active = reviewHighlightsState.includes(item);
                        return (
                          <button
                            key={item}
                            type="button"
                            onClick={() =>
                              setReviewHighlightsState((current) =>
                                active ? current.filter((value) => value !== item) : [...current, item]
                              )
                            }
                            className={active ? "rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground" : "rounded-lg border px-3 py-2 text-sm font-medium text-muted-foreground"}
                          >
                            {item}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <label className="grid gap-2 text-sm font-medium">
                    Комментарий
                    <Textarea value={reviewText} onChange={(event) => setReviewText(event.target.value)} placeholder="Кратко расскажите, как прошла сделка." />
                  </label>
                  <Button className="w-fit" disabled={reviewBusy} onClick={submitReview}>
                    Сохранить отзыв
                  </Button>
                </CardContent>
              </Card>
            ) : trustData.reviewableDeals.some((deal) => !deal.has_review) ? (
              <Card className="bg-white/92">
                <CardContent className="p-5 text-sm leading-6 text-muted-foreground">
                  Оценку по сделке можно оставить из раздела «Сделки» после ее завершения.
                </CardContent>
              </Card>
            ) : null}
          </div>
        </TabsContent>
        <TabsContent value="settings">
            <Card className="bg-white/92">
              <CardContent className="p-5 text-sm leading-6 text-muted-foreground">
                Здесь собраны ваши базовые настройки профиля и уведомлений.
              </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
