"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

export function SupabaseProfileScreen() {
  const router = useRouter();
  const { toast } = useToast();
  const { loading, user, profile } = useSupabaseSession();
  const [trustData, setTrustData] = React.useState<SupabaseProfileTrustData>({
    reviews: [],
    reviewableDeals: []
  });
  const [trustLoading, setTrustLoading] = React.useState(false);
  const [reviewText, setReviewText] = React.useState("Быстро договорились, сделка прошла спокойно.");
  const [reviewRating, setReviewRating] = React.useState<Review["rating"]>(5);
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
          description: error instanceof Error ? error.message : "Supabase вернул ошибку."
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

  const nextReviewDeal = trustData.reviewableDeals.find((deal) => !deal.has_review);

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
        text: reviewText
      });
      const next = user ? await fetchSupabaseProfileTrustData(user.id) : trustData;
      setTrustData(next);
      toast({ title: "Отзыв сохранен", description: "Rating и reviews_count обновятся trigger-функцией." });
    } catch (error) {
      toast({
        title: "Отзыв не сохранен",
        description: error instanceof Error ? error.message : "Supabase вернул ошибку."
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
          Загружаю Supabase profile
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
            Session активна, но записи в <code>profiles</code> еще нет.
          </p>
          <Button className="w-fit" onClick={() => router.push("/onboarding")}>
            Перейти в onboarding
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

      <Tabs defaultValue="account">
        <TabsList>
          <TabsTrigger value="account">Аккаунт</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="reviews">Отзывы</TabsTrigger>
          <TabsTrigger value="settings">Настройки</TabsTrigger>
        </TabsList>
        <TabsContent value="account">
          <Card className="bg-white/92">
            <CardContent className="grid gap-3 p-5 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">User ID</span>
                <span className="break-all font-medium">{user.id}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Email</span>
                <span className="font-medium">{profile.email ?? user.email ?? "Не указан"}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Role</span>
                <span className="font-medium">{profile.role}</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="security">
          <Card className="bg-white/92">
            <CardContent className="p-5 text-sm leading-6 text-muted-foreground">
              Phone OTP abstraction, email/password session and protected routes are wired. Verification flags are now updateable by moderator/admin users in Trust & Safety.
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
                  Отзывов пока нет. После завершенной сделки counterparty сможет оставить оценку.
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
                    Сделка {formatMoney({ amount: nextReviewDeal.amount, currency: nextReviewDeal.currency })} завершена, можно оценить вторую сторону.
                  </p>
                  <label className="grid gap-2 text-sm font-medium">
                    Оценка
                    <select
                      value={reviewRating}
                      onChange={(event) => setReviewRating(Number(event.target.value) as Review["rating"])}
                      className="h-11 rounded-lg border bg-white px-3 text-sm"
                    >
                      {[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating}</option>)}
                    </select>
                  </label>
                  <label className="grid gap-2 text-sm font-medium">
                    Текст
                    <Textarea value={reviewText} onChange={(event) => setReviewText(event.target.value)} />
                  </label>
                  <Button className="w-fit" disabled={reviewBusy} onClick={submitReview}>
                    Сохранить отзыв
                  </Button>
                </CardContent>
              </Card>
            ) : null}
          </div>
        </TabsContent>
        <TabsContent value="settings">
          <Card className="bg-white/92">
            <CardContent className="p-5 text-sm leading-6 text-muted-foreground">
              In-app notifications are wired in Supabase. WhatsApp and SMS remain opt-in placeholders.
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
