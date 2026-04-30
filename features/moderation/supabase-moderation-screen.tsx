"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Flag, Loader2, ShieldAlert, ShieldCheck, UserX } from "lucide-react";
import type { Complaint, ID, ModerationCase } from "@/lib/domain";
import type { Database } from "@/lib/supabase/database.types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import {
  blockSupabaseProfile,
  createSupabaseComplaint,
  decideSupabaseModeration,
  fetchSupabaseModerationData,
  type SupabaseModerationData,
  updateSupabaseComplaintStatus,
  verifySupabaseProfile
} from "@/features/moderation/lib/supabase-moderation";
import { STATUS_TONE } from "@/lib/theme";
import { formatRelativeDate } from "@/lib/utils/format";
import {
  complaintReasonLabel,
  complaintStatusLabel,
  complaintTargetTypeLabel,
  listingStatusLabel,
  moderationStatusLabel
} from "@/lib/utils/labels";

const reasons: Complaint["reason"][] = ["spam", "fraud", "prohibited_item", "abuse", "other"];
const verificationStatuses: Database["public"]["Enums"]["verification_status"][] = ["none", "phone", "document", "trusted"];
const verificationStatusLabel: Record<Database["public"]["Enums"]["verification_status"], string> = {
  none: "Не подтвержден",
  phone: "Телефон подтвержден",
  document: "Документы подтверждены",
  trusted: "Проверенный профиль"
};

export function SupabaseModerationScreen() {
  const { toast } = useToast();
  const [data, setData] = React.useState<SupabaseModerationData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [busyAction, setBusyAction] = React.useState<string | null>(null);
  const [targetId, setTargetId] = React.useState("");
  const [reason, setReason] = React.useState<Complaint["reason"]>("other");
  const [details, setDetails] = React.useState("");
  const [moderationNotes, setModerationNotes] = React.useState<Record<ID, string>>({});
  const [expandedComplaintId, setExpandedComplaintId] = React.useState<ID | null>(null);
  const [expandedCaseId, setExpandedCaseId] = React.useState<ID | null>(null);
  const [trustUserId, setTrustUserId] = React.useState("");
  const [blockReason, setBlockReason] = React.useState("Повторное нарушение правил площадки.");
  const [verificationStatus, setVerificationStatus] = React.useState<Database["public"]["Enums"]["verification_status"]>("trusted");

  const load = React.useCallback(async () => {
    setLoading(true);

    try {
      const next = await fetchSupabaseModerationData();
      setData(next);
      setTargetId((current) => current || next.cases[0]?.listingId || "");
    } catch (error) {
      toast({
        title: "Раздел модерации не загрузился",
        description: error instanceof Error ? error.message : "Попробуйте еще раз."
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    void load();
  }, [load]);

  async function submitComplaint() {
    if (!targetId.trim()) {
      toast({ title: "Укажите ID объявления", description: "Например, возьмите его из карточки товара или списка модерации." });
      return;
    }

    if (!details.trim()) {
      toast({ title: "Добавьте детали", description: "Короткого описания достаточно." });
      return;
    }

    setBusyAction("complaint");

    try {
      const complaint = await createSupabaseComplaint({
        targetType: "listing",
        targetId,
        reason,
        details
      });
      setData((current) => current ? { ...current, complaints: [complaint, ...current.complaints] } : current);
      setDetails("");
      toast({ title: "Жалоба создана", description: "Обращение зарегистрировано." });
    } catch (error) {
      toast({
        title: "Жалоба не создана",
        description: error instanceof Error ? error.message : "Попробуйте еще раз."
      });
    } finally {
      setBusyAction(null);
    }
  }

  async function decide(caseItem: ModerationCase, decision: Exclude<ModerationCase["status"], "open">) {
    const note = moderationNotes[caseItem.listingId];
    setBusyAction(`${caseItem.id}:${decision}`);

    try {
      await decideSupabaseModeration(caseItem.listingId, decision, note);
      setData((current) =>
        current
          ? {
              ...current,
              cases: current.cases.filter((item) => item.id !== caseItem.id)
            }
          : current
      );
      toast({
        title: decision === "approved" ? "Объявление опубликовано" : "Статус модерации обновлен",
        description: decision === "approved" ? "Объявление появилось в каталоге." : "Комментарий продавцу сохранен."
      });
      void load();
    } catch (error) {
      toast({
        title: "Модерация не сохранена",
        description: error instanceof Error ? error.message : "Попробуйте еще раз."
      });
    } finally {
      setBusyAction(null);
    }
  }

  async function updateComplaint(complaint: Complaint, status: Exclude<Complaint["status"], "submitted">) {
    setBusyAction(`${complaint.id}:${status}`);

    try {
      const next = await updateSupabaseComplaintStatus(complaint.id, status);
      setData((current) =>
        current
          ? {
              ...current,
              complaints:
                next.status === "resolved" || next.status === "dismissed"
                  ? current.complaints.filter((item) => item.id !== next.id)
                  : current.complaints.map((item) => (item.id === next.id ? next : item))
            }
          : current
      );
      toast({ title: "Статус жалобы обновлен", description: complaintStatusLabel[next.status] });
    } catch (error) {
      toast({
        title: "Жалоба не обновлена",
        description: error instanceof Error ? error.message : "Попробуйте еще раз."
      });
    } finally {
      setBusyAction(null);
    }
  }

  async function blockUser(profileId: ID) {
    setBusyAction(`block:${profileId}`);

    try {
      await blockSupabaseProfile(profileId, blockReason);
      toast({ title: "Пользователь заблокирован", description: "Доступ к площадке ограничен." });
      void load();
    } catch (error) {
      toast({
        title: "Пользователь не заблокирован",
        description: error instanceof Error ? error.message : "Для этого действия нужны права администратора."
      });
    } finally {
      setBusyAction(null);
    }
  }

  async function verifyUser() {
    if (!trustUserId.trim()) {
      toast({ title: "Укажите ID пользователя" });
      return;
    }

    setBusyAction("verify");

    try {
      await verifySupabaseProfile(trustUserId, verificationStatus);
      toast({ title: "Верификация обновлена", description: verificationStatus });
      void load();
    } catch (error) {
      toast({
        title: "Верификация не обновлена",
        description: error instanceof Error ? error.message : "Попробуйте еще раз."
      });
    } finally {
      setBusyAction(null);
    }
  }

  if (loading) {
    return (
      <Card className="bg-card/92">
        <CardContent className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Загружаю модерацию
        </CardContent>
      </Card>
    );
  }

  if (!data?.userId) {
    return (
      <EmptyState
        title="Войдите, чтобы открыть модерацию"
        description="Жалобы и очередь модерации доступны после входа."
        actionLabel="Войти"
        actionHref="/auth/sign-in?redirectTo=/moderation"
        icon={<ShieldCheck className="h-6 w-6" />}
      />
    );
  }

  const currentData = data;

  return (
    <div className="grid gap-6">
      <Card className="bg-card/92">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Модерация и жалобы
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm leading-6 text-muted-foreground">
          <p>
            Здесь обрабатываются жалобы, очередь модерации и действия по безопасности площадки.
          </p>
          <p>
            Текущая роль: <span className="font-semibold text-foreground">{currentData.profile?.role ?? "неизвестно"}</span>.
            {!currentData.isStaff ? " Для работы с очередью модерации нужна роль moderator или admin." : null}
          </p>
        </CardContent>
      </Card>

      <Tabs defaultValue="complaints">
        <TabsList>
          <TabsTrigger value="complaints">Жалобы</TabsTrigger>
          <TabsTrigger value="cases">Модерация объявлений</TabsTrigger>
          <TabsTrigger value="report">Создать жалобу</TabsTrigger>
          <TabsTrigger value="tools">Инструменты</TabsTrigger>
        </TabsList>

        <TabsContent value="complaints">
          <div className="grid gap-3">
            {currentData.complaints.length ? (
              currentData.complaints.map((complaint) => {
                const targetConversation = complaint.targetType === "conversation" ? currentData.conversationsById[complaint.targetId] : null;
                const targetListing = complaint.targetType === "listing"
                  ? currentData.listingsById[complaint.targetId]
                  : targetConversation
                    ? currentData.listingsById[targetConversation.listingId]
                    : null;
                const reporter = currentData.usersById[complaint.reporterId];
                const targetUserId = complaint.targetType === "user" ? complaint.targetId : targetListing?.sellerId;
                const targetUser = targetUserId ? currentData.usersById[targetUserId] : null;
                const sellerListings = targetUserId ? currentData.listingsBySellerId[targetUserId] ?? [] : [];
                const expanded = expandedComplaintId === complaint.id;

                return (
                  <Card key={complaint.id} className="bg-card/92">
                    <CardContent className="grid gap-4 p-4">
                      <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-start">
                        <div>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant={complaint.status === "resolved" ? "success" : complaint.status === "dismissed" ? "secondary" : "warning"}>
                              {complaintStatusLabel[complaint.status]}
                            </Badge>
                            <Badge variant="outline" className="bg-background">{complaintReasonLabel[complaint.reason]}</Badge>
                            <Badge variant="outline" className="bg-background">{complaintTargetTypeLabel[complaint.targetType]}</Badge>
                          </div>
                          <p className="mt-2 font-semibold">{complaint.details}</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Автор жалобы: {reporter?.displayName ?? complaint.reporterId} · {formatRelativeDate(complaint.createdAt)}
                          </p>
                          {targetListing ? (
                            <p className="mt-1 text-sm text-muted-foreground">
                              Объявление: {targetListing.title} · продавец {targetUser?.displayName ?? targetListing.sellerId}
                            </p>
                          ) : null}
                        </div>
                        {complaint.targetType === "listing" ? (
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/listings/${complaint.targetId}`}>Открыть объявление</Link>
                          </Button>
                        ) : complaint.targetType === "user" ? (
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/users/${complaint.targetId}`}>Открыть профиль</Link>
                          </Button>
                        ) : complaint.targetType === "conversation" ? (
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/chat/${complaint.targetId}`}>Открыть диалог</Link>
                          </Button>
                        ) : null}
                      </div>
                      {complaint.targetType === "conversation" && expanded ? (
                        <div className="grid gap-4 rounded-lg border bg-background p-4 lg:grid-cols-[1.15fr_0.85fr]">
                          <div className="grid gap-4">
                            {targetListing ? (
                              <>
                                <div className="grid gap-3">
                                  <p className="text-sm font-semibold">Объявление</p>
                                  {targetListing.images[0] ? (
                                    <div className="relative aspect-[4/3] overflow-hidden rounded-lg border bg-muted">
                                      <Image src={targetListing.images[0].url} alt={targetListing.images[0].alt} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 40vw" />
                                    </div>
                                  ) : null}
                                  <div className="grid gap-2 text-sm">
                                    <p className="font-semibold">{targetListing.title}</p>
                                    <p className="text-muted-foreground">{targetListing.description}</p>
                                    <div className="flex flex-wrap gap-2">
                                      <Badge variant={STATUS_TONE[targetListing.status]}>{listingStatusLabel[targetListing.status]}</Badge>
                                      <Badge variant="outline" className="bg-background">{targetListing.viewsCount} просмотров</Badge>
                                    </div>
                                  </div>
                                </div>
                              </>
                            ) : (
                              <p className="text-sm text-muted-foreground">Для этой жалобы нет связанного объявления.</p>
                            )}
                          </div>
                          <div className="grid gap-4">
                            <div className="grid gap-2 text-sm">
                              <p className="font-semibold">Профиль продавца</p>
                              <p>{targetUser?.displayName ?? "Пользователь не найден"}</p>
                              <p className="text-muted-foreground">
                                Рейтинг: {targetUser?.rating ?? 0} · отзывов: {targetUser?.reviewsCount ?? 0} · сделок: {targetUser?.completedDealsCount ?? 0}
                              </p>
                              <p className="text-muted-foreground">Роль: {targetUser?.role ?? "unknown"}</p>
                            </div>
                            {sellerListings.length ? (
                              <div className="grid gap-2 text-sm">
                                <p className="font-semibold">Другие объявления продавца</p>
                                <div className="grid gap-2">
                                  {sellerListings.slice(0, 4).map((listing) => (
                                    <div key={listing.id} className="rounded-lg border p-3">
                                      <div className="flex items-center justify-between gap-2">
                                        <span className="font-medium">{listing.title}</span>
                                        <Badge variant={STATUS_TONE[listing.status]}>{listingStatusLabel[listing.status]}</Badge>
                                      </div>
                                      <p className="mt-1 text-muted-foreground">{listing.location.label}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      ) : null}
                      {complaint.targetType === "conversation" ? (
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" variant="outline" onClick={() => setExpandedComplaintId(expanded ? null : complaint.id)}>
                            {expanded ? "Скрыть детали" : "Подробнее"}
                          </Button>
                        </div>
                      ) : null}
                      {currentData.isStaff ? (
                        <div className="flex flex-wrap gap-2 rounded-lg border bg-background p-3">
                          <Button size="sm" variant="outline" disabled={busyAction === `${complaint.id}:reviewing`} onClick={() => updateComplaint(complaint, "reviewing")}>
                            Взять в работу
                          </Button>
                          <Button size="sm" disabled={busyAction === `${complaint.id}:resolved`} onClick={() => updateComplaint(complaint, "resolved")}>
                            Решена
                          </Button>
                          <Button size="sm" variant="outline" disabled={busyAction === `${complaint.id}:dismissed`} onClick={() => updateComplaint(complaint, "dismissed")}>
                            Отклонить жалобу
                          </Button>
                          {currentData.isAdmin && targetUserId ? (
                            <Button size="sm" variant="destructive" disabled={busyAction === `block:${targetUserId}`} onClick={() => blockUser(targetUserId)}>
                              <UserX className="h-4 w-4" />
                              Заблокировать пользователя
                            </Button>
                          ) : null}
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <EmptyState
                title="Жалоб пока нет"
                description="Новые обращения появятся здесь."
                icon={<Flag className="h-6 w-6" />}
              />
            )}
          </div>
        </TabsContent>

        <TabsContent value="cases">
          {!currentData.isStaff ? (
            <EmptyState
              title="Нужна роль moderator или admin"
              description="Обычному пользователю этот раздел недоступен."
              icon={<ShieldAlert className="h-6 w-6" />}
            />
          ) : (
            <div className="grid gap-3">
              {currentData.cases.length ? (
                currentData.cases.map((item) => {
                  const listing = currentData.listingsById[item.listingId];
                  const seller = listing ? currentData.usersById[listing.sellerId] : null;
                  const expanded = expandedCaseId === item.id;
                  return (
                    <Card key={item.id} className="bg-card/92">
                      <CardContent className="grid gap-4 p-4">
                        <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-start">
                          <div>
                            <div className="flex flex-wrap gap-2">
                              <Badge variant="warning">{moderationStatusLabel[item.status]}</Badge>
                              {listing ? (
                                <Badge variant={STATUS_TONE[listing.status]}>{listingStatusLabel[listing.status]}</Badge>
                              ) : null}
                              <span className="text-sm text-muted-foreground">{listing?.title ?? item.listingId}</span>
                            </div>
                            <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.note ?? "Ожидает решения модератора."}</p>
                          </div>
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/listings/${item.listingId}`}>Открыть</Link>
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" variant="outline" onClick={() => setExpandedCaseId(expanded ? null : item.id)}>
                            {expanded ? "Скрыть детали" : "Подробнее"}
                          </Button>
                        </div>
                        {expanded && listing ? (
                          <div className="grid gap-4 rounded-lg border bg-background p-4 lg:grid-cols-[1.15fr_0.85fr]">
                            <div className="grid gap-3">
                              {listing.images[0] ? (
                                <div className="relative aspect-[4/3] overflow-hidden rounded-lg border bg-muted">
                                  <Image src={listing.images[0].url} alt={listing.images[0].alt} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 40vw" />
                                </div>
                              ) : null}
                              <p className="font-semibold">{listing.title}</p>
                              <p className="text-sm text-muted-foreground">{listing.description}</p>
                            </div>
                            <div className="grid gap-3 text-sm">
                              <p className="font-semibold">Детали объявления</p>
                              <div className="rounded-lg border p-3">
                                <p>Продавец: {seller?.displayName ?? listing.sellerId}</p>
                                <p className="text-muted-foreground">Рейтинг: {seller?.rating ?? 0} · отзывов: {seller?.reviewsCount ?? 0}</p>
                              </div>
                              <div className="rounded-lg border p-3">
                                <p>Локация: {listing.location.label}</p>
                                <p>Просмотры: {listing.viewsCount}</p>
                                <p>Статус: {listingStatusLabel[listing.status]}</p>
                              </div>
                              {listing.attributes.length ? (
                                <div className="rounded-lg border p-3">
                                  <p className="mb-2 font-semibold">Характеристики</p>
                                  <div className="grid gap-1">
                                    {listing.attributes.slice(0, 6).map((attribute) => (
                                      <p key={attribute.label} className="text-muted-foreground">
                                        {attribute.label}: {attribute.value}
                                      </p>
                                    ))}
                                  </div>
                                </div>
                              ) : null}
                            </div>
                          </div>
                        ) : null}
                        <div className="grid gap-3 rounded-lg border bg-background p-3">
                          <label className="grid gap-2 text-sm font-medium">
                            Комментарий модератора
                            <Textarea
                              value={moderationNotes[item.listingId] ?? ""}
                              onChange={(event) =>
                                setModerationNotes((current) => ({
                                  ...current,
                                  [item.listingId]: event.target.value
                                }))
                              }
                              placeholder="Например: фото и описание соответствуют правилам."
                            />
                          </label>
                          <div className="flex flex-wrap gap-2">
                            <Button size="sm" disabled={busyAction === `${item.id}:approved`} onClick={() => decide(item, "approved")}>
                              Одобрить и опубликовать
                            </Button>
                            <Button size="sm" variant="outline" disabled={busyAction === `${item.id}:needs_changes`} onClick={() => decide(item, "needs_changes")}>
                              Нужны правки
                            </Button>
                            <Button size="sm" variant="destructive" disabled={busyAction === `${item.id}:rejected`} onClick={() => decide(item, "rejected")}>
                              Отклонить
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              ) : (
                <EmptyState
                  title="Очередь модерации пуста"
                  description="Новые объявления для проверки появятся здесь после отправки на модерацию."
                  icon={<ShieldCheck className="h-6 w-6" />}
                />
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="report">
          <Card className="bg-card/92">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flag className="h-5 w-5 text-primary" />
                Новая жалоба
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <label className="grid gap-2 text-sm font-medium">
                ID объявления
                <Input value={targetId} onChange={(event) => setTargetId(event.target.value)} />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Причина
                <select value={reason} onChange={(event) => setReason(event.target.value as Complaint["reason"])} className="h-11 rounded-lg border bg-background px-3 text-sm">
                  {reasons.map((item) => <option key={item} value={item}>{complaintReasonLabel[item]}</option>)}
                </select>
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Детали
                <Textarea value={details} onChange={(event) => setDetails(event.target.value)} />
              </label>
              <Button disabled={busyAction === "complaint"} onClick={submitComplaint}>
                <ShieldAlert className="h-4 w-4" />
                Отправить
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tools">
          <Card className="bg-card/92">
            <CardHeader>
              <CardTitle>Инструменты модератора</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <label className="grid gap-2 text-sm font-medium">
                ID пользователя
                <Input value={trustUserId} onChange={(event) => setTrustUserId(event.target.value)} placeholder="UUID профиля" />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Статус верификации
                <select
                  value={verificationStatus}
                  onChange={(event) => setVerificationStatus(event.target.value as Database["public"]["Enums"]["verification_status"])}
                  className="h-11 rounded-lg border bg-background px-3 text-sm"
                >
                  {verificationStatuses.map((status) => <option key={status} value={status}>{verificationStatusLabel[status]}</option>)}
                </select>
              </label>
              <Button className="w-fit" disabled={busyAction === "verify" || !currentData.isStaff} onClick={verifyUser}>
                Обновить верификацию
              </Button>
              <label className="grid gap-2 text-sm font-medium">
                Причина блокировки
                <Textarea value={blockReason} onChange={(event) => setBlockReason(event.target.value)} />
              </label>
              <Button className="w-fit" variant="destructive" disabled={!currentData.isAdmin || !trustUserId.trim()} onClick={() => blockUser(trustUserId)}>
                <UserX className="h-4 w-4" />
                Заблокировать пользователя
              </Button>
              {!currentData.isAdmin ? (
                <p className="text-sm text-muted-foreground">Блокировка доступна только администратору. Верификация доступна модератору и администратору.</p>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
