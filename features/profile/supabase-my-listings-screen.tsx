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
import { useLanguage, type PineLanguage } from "@/lib/i18n/language-provider";
import { mapListing, type SupabaseListingRecord } from "@/lib/repositories/supabase/mappers";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { STATUS_TONE } from "@/lib/theme";
import { formatMoney } from "@/lib/utils/format";
import { listingStatusLabel } from "@/lib/utils/labels";

const groups: Array<{ value: Listing["status"] | "all"; label: Record<PineLanguage, string> }> = [
  { value: "all", label: { ru: "Все", en: "All" } },
  { value: "draft", label: { ru: "Черновики", en: "Drafts" } },
  { value: "pending", label: { ru: "На модерации", en: "In moderation" } },
  { value: "published", label: { ru: "Опубликованные", en: "Published" } },
  { value: "needs_changes", label: { ru: "Нужны правки", en: "Needs changes" } },
  { value: "sold", label: { ru: "Проданные", en: "Sold" } }
];

const listingStatusLabelByLanguage: Record<Listing["status"], Record<PineLanguage, string>> = {
  draft: { ru: "Черновик", en: "Draft" },
  pending: { ru: "На модерации", en: "In moderation" },
  published: { ru: "Опубликовано", en: "Published" },
  needs_changes: { ru: "Нужны правки", en: "Needs changes" },
  rejected: { ru: "Отклонено", en: "Rejected" },
  reserved: { ru: "В резерве", en: "Reserved" },
  sold: { ru: "Продано", en: "Sold" }
};

const moderationNoteTranslations: Record<string, string> = {
  "Объявление отклонено и скрыто из публикации.": "The listing was rejected and hidden from publication.",
  "Объявление опубликовано в каталоге.": "The listing is published in the catalog.",
  "Объявление ожидает проверки.": "The listing is waiting for review.",
  "Повторная отправка на модерацию.": "Sent back for moderation review.",
  "Объявление обновлено и отправлено на повторную проверку.": "The listing was updated and sent for another review.",
  "Объявление ожидает первой проверки.": "The listing is waiting for its first review."
};

function translateModerationNote(note: string, language: PineLanguage) {
  if (language === "ru") {
    return note;
  }

  return moderationNoteTranslations[note] ?? note;
}

export function SupabaseMyListingsScreen() {
  const { toast } = useToast();
  const { language } = useLanguage();
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

    toast({ title: "Статус обновлен", description: "Объявление отмечено как проданное." });
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
          <p className="text-sm text-muted-foreground">Следите за статусом публикации, правками после проверки и продажами.</p>
        </CardContent>
      </Card>

      <Tabs defaultValue="all">
        <TabsList className="flex h-auto flex-wrap justify-start">
          {groups.map((group) => (
            <TabsTrigger key={group.value} value={group.value}>{group.label[language]}</TabsTrigger>
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
                          <Badge variant={STATUS_TONE[listing.status]}>
                            {listingStatusLabelByLanguage[listing.status]?.[language] ?? listingStatusLabel[listing.status]}
                          </Badge>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {formatMoney(listing.price)} · {language === "en" ? `${listing.viewsCount} views` : `${listing.viewsCount} просмотров`}
                        </p>
                        {listing.moderationNote ? (
                          <p className="mt-2 text-sm text-muted-foreground">{translateModerationNote(listing.moderationNote, language)}</p>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/listings/${listing.id}`}>Открыть</Link>
                        </Button>
                        {listing.status !== "sold" ? (
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/sell?edit=${listing.id}`}>Редактировать</Link>
                          </Button>
                        ) : null}
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
