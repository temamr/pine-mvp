"use client";

import * as React from "react";
import Link from "next/link";
import { Loader2, ShieldCheck, Star, UserRound } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchSupabasePublicProfileData, type SupabasePublicProfileData } from "@/features/profile/lib/supabase-profile";
import { useLanguage, type PineLanguage } from "@/lib/i18n/language-provider";
import { formatRelativeDate } from "@/lib/utils/format";

const verificationLabel: Record<string, Record<PineLanguage, string>> = {
  none: { ru: "Не подтвержден", en: "Not verified" },
  phone: { ru: "Телефон подтвержден", en: "Phone verified" },
  document: { ru: "Документы подтверждены", en: "Documents verified" },
  trusted: { ru: "Проверенный профиль", en: "Trusted profile" }
};

const reviewTextTranslations: Record<string, string> = {
  "Что понравилось": "What went well",
  "Вежливое общение": "Polite communication",
  "Быстрый выход на связь": "Quick response",
  "Честное описание": "Honest description",
  "Аккуратная упаковка": "Careful packaging",
  "Пунктуальность": "Punctuality",
  "Быстро договорились, сделка прошла спокойно.": "We agreed quickly, and the deal went smoothly."
};

function translateReviewText(text: string, language: PineLanguage) {
  if (language === "ru") {
    return text;
  }

  return Object.entries(reviewTextTranslations).reduce(
    (next, [ru, en]) => next.replaceAll(ru, en),
    text
  );
}

export function PublicUserProfileScreen({ userId }: { userId: string }) {
  const { language } = useLanguage();
  const [data, setData] = React.useState<SupabasePublicProfileData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;
    setLoading(true);

    fetchSupabasePublicProfileData(userId)
      .then((next) => {
        if (active) {
          setData(next);
          setError(null);
        }
      })
      .catch((nextError) => {
        if (active) {
          setError(nextError instanceof Error ? nextError.message : "Не удалось загрузить профиль.");
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [userId]);

  if (loading) {
    return (
      <Card className="bg-white/92">
        <CardContent className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          {language === "en" ? "Loading user profile" : "Загружаю профиль пользователя"}
        </CardContent>
      </Card>
    );
  }

  if (error || !data?.profile) {
    return (
      <Card className="bg-white/92">
        <CardHeader>
          <CardTitle>{language === "en" ? "Profile not found" : "Профиль не найден"}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <p className="text-sm text-muted-foreground">
            {error ? (language === "en" && error === "Не удалось загрузить профиль." ? "Could not load profile." : error) : language === "en" ? "User is unavailable." : "Пользователь недоступен."}
          </p>
          <Button asChild className="w-fit" variant="outline">
            <Link href="/moderation">{language === "en" ? "Back to moderation" : "Вернуться в модерацию"}</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { profile, reviews } = data;

  return (
    <div className="grid gap-6">
      <Card className="bg-white/92">
        <CardContent className="grid gap-5 p-5 md:grid-cols-[auto_1fr] md:items-center">
          <Avatar className="h-24 w-24">
            <AvatarImage src={profile.avatar_url ?? undefined} />
            <AvatarFallback>{profile.display_name.slice(0, 2)}</AvatarFallback>
          </Avatar>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-bold">{profile.display_name}</h1>
              <Badge variant="success">
                <ShieldCheck className="mr-1 h-3 w-3" />
                {verificationLabel[profile.verification_status]?.[language] ?? profile.verification_status}
              </Badge>
            </div>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              {profile.bio ?? (language === "en" ? "Pine user." : "Пользователь Pine.")}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant="outline" className="bg-white">
                <Star className="mr-1 h-3 w-3 fill-current" />
                {profile.rating} · {language === "en" ? `${profile.reviews_count} reviews` : `${profile.reviews_count} отзывов`}
              </Badge>
              <Badge variant="outline" className="bg-white">
                {language === "en" ? `${profile.completed_deals_count} deals` : `${profile.completed_deals_count} сделок`}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/92">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserRound className="h-5 w-5 text-primary" />
            {language === "en" ? "Latest reviews" : "Последние отзывы"}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          {reviews.length ? (
            reviews.map((review) => (
              <div key={review.id} className="rounded-lg border bg-background p-4">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-white">
                    <Star className="mr-1 h-3 w-3 fill-current" />
                    {review.rating}
                  </Badge>
                  <span className="text-sm text-muted-foreground">{formatRelativeDate(review.createdAt)}</span>
                </div>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{translateReviewText(review.text, language)}</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">{language === "en" ? "No reviews yet." : "Отзывов пока нет."}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
