"use client";

import * as React from "react";
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
import { complaintStatusLabel, listingStatusLabel, moderationStatusLabel } from "@/lib/utils/labels";

const reasons: Complaint["reason"][] = ["spam", "fraud", "prohibited_item", "abuse", "other"];
const verificationStatuses: Database["public"]["Enums"]["verification_status"][] = ["none", "phone", "document", "trusted"];

export function SupabaseModerationScreen() {
  const { toast } = useToast();
  const [data, setData] = React.useState<SupabaseModerationData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [busyAction, setBusyAction] = React.useState<string | null>(null);
  const [targetId, setTargetId] = React.useState("");
  const [reason, setReason] = React.useState<Complaint["reason"]>("other");
  const [details, setDetails] = React.useState("");
  const [moderationNotes, setModerationNotes] = React.useState<Record<ID, string>>({});
  const [trustUserId, setTrustUserId] = React.useState("");
  const [blockReason, setBlockReason] = React.useState("Repeated marketplace policy violation.");
  const [verificationStatus, setVerificationStatus] = React.useState<Database["public"]["Enums"]["verification_status"]>("trusted");

  const load = React.useCallback(async () => {
    setLoading(true);

    try {
      const next = await fetchSupabaseModerationData();
      setData(next);
      setTargetId((current) => current || next.cases[0]?.listingId || "");
    } catch (error) {
      toast({
        title: "Trust data не загрузились",
        description: error instanceof Error ? error.message : "Supabase вернул ошибку."
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
      toast({ title: "Укажите target ID", description: "Можно использовать listing, user или conversation ID." });
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
      toast({ title: "Жалоба создана", description: "Статус теперь хранится в Supabase." });
    } catch (error) {
      toast({
        title: "Жалоба не создана",
        description: error instanceof Error ? error.message : "Supabase вернул ошибку."
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
        description: decision === "approved" ? "Объявление ушло в каталог." : "Seller feedback сохранен."
      });
      void load();
    } catch (error) {
      toast({
        title: "Модерация не сохранена",
        description: error instanceof Error ? error.message : "Supabase вернул ошибку."
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
              complaints: current.complaints.map((item) => (item.id === next.id ? next : item))
            }
          : current
      );
      toast({ title: "Статус жалобы обновлен", description: complaintStatusLabel[next.status] });
    } catch (error) {
      toast({
        title: "Жалоба не обновлена",
        description: error instanceof Error ? error.message : "Supabase вернул ошибку."
      });
    } finally {
      setBusyAction(null);
    }
  }

  async function blockUser(profileId: ID) {
    setBusyAction(`block:${profileId}`);

    try {
      await blockSupabaseProfile(profileId, blockReason);
      toast({ title: "Пользователь заблокирован", description: "blocked_at и причина записаны в profiles." });
      void load();
    } catch (error) {
      toast({
        title: "Пользователь не заблокирован",
        description: error instanceof Error ? error.message : "Нужна admin role."
      });
    } finally {
      setBusyAction(null);
    }
  }

  async function verifyUser() {
    if (!trustUserId.trim()) {
      toast({ title: "Укажите User ID" });
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
        description: error instanceof Error ? error.message : "Supabase вернул ошибку."
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
          Загружаю Supabase Trust & Safety
        </CardContent>
      </Card>
    );
  }

  if (!data?.userId) {
    return (
      <EmptyState
        title="Войдите для Trust & Safety"
        description="Жалобы и статусы модерации привязаны к Supabase profile."
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
            Trust & Safety
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm leading-6 text-muted-foreground">
          <p>
            Supabase mode: жалобы, очередь модерации, seller feedback, review counters и admin actions работают через RLS/RPC.
          </p>
          <p>
            Текущая роль: <span className="font-semibold text-foreground">{currentData.profile?.role ?? "unknown"}</span>.
            {!currentData.isStaff ? " Для очереди модерации нужна role moderator или admin." : null}
          </p>
        </CardContent>
      </Card>

      <Tabs defaultValue="complaints">
        <TabsList>
          <TabsTrigger value="complaints">Жалобы</TabsTrigger>
          <TabsTrigger value="cases">Модерация объявлений</TabsTrigger>
          <TabsTrigger value="report">Создать жалобу</TabsTrigger>
          <TabsTrigger value="tools">Trust tools</TabsTrigger>
        </TabsList>

        <TabsContent value="complaints">
          <div className="grid gap-3">
            {currentData.complaints.length ? (
              currentData.complaints.map((complaint) => {
                const targetListing = complaint.targetType === "listing" ? currentData.listingsById[complaint.targetId] : null;
                const reporter = currentData.usersById[complaint.reporterId];
                const targetUserId = complaint.targetType === "user" ? complaint.targetId : targetListing?.sellerId;
                const targetUser = targetUserId ? currentData.usersById[targetUserId] : null;

                return (
                  <Card key={complaint.id} className="bg-card/92">
                    <CardContent className="grid gap-4 p-4">
                      <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-start">
                        <div>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant={complaint.status === "resolved" ? "success" : complaint.status === "dismissed" ? "secondary" : "warning"}>
                              {complaintStatusLabel[complaint.status]}
                            </Badge>
                            <Badge variant="outline" className="bg-background">{complaint.reason}</Badge>
                            <Badge variant="outline" className="bg-background">{complaint.targetType}</Badge>
                          </div>
                          <p className="mt-2 font-semibold">{complaint.details}</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Reporter: {reporter?.displayName ?? complaint.reporterId} · {formatRelativeDate(complaint.createdAt)}
                          </p>
                          {targetListing ? (
                            <p className="mt-1 text-sm text-muted-foreground">
                              Listing: {targetListing.title} · seller {targetUser?.displayName ?? targetListing.sellerId}
                            </p>
                          ) : null}
                        </div>
                        {complaint.targetType === "listing" ? (
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/listings/${complaint.targetId}`}>Открыть target</Link>
                          </Button>
                        ) : null}
                      </div>
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
                              Заблокировать target
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
                description="Созданные обращения появятся здесь и будут храниться в Supabase."
                icon={<Flag className="h-6 w-6" />}
              />
            )}
          </div>
        </TabsContent>

        <TabsContent value="cases">
          {!currentData.isStaff ? (
            <EmptyState
              title="Нужна роль moderator или admin"
              description="Обычный пользователь видит только собственные жалобы и seller feedback."
              icon={<ShieldAlert className="h-6 w-6" />}
            />
          ) : (
            <div className="grid gap-3">
              {currentData.cases.length ? (
                currentData.cases.map((item) => {
                  const listing = currentData.listingsById[item.listingId];
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
                  description="Новые pending listings появятся здесь после отправки объявления на проверку."
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
                Listing ID
                <Input value={targetId} onChange={(event) => setTargetId(event.target.value)} />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Причина
                <select value={reason} onChange={(event) => setReason(event.target.value as Complaint["reason"])} className="h-11 rounded-lg border bg-background px-3 text-sm">
                  {reasons.map((item) => <option key={item} value={item}>{item}</option>)}
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
              <CardTitle>Admin / moderator tools</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <label className="grid gap-2 text-sm font-medium">
                User ID
                <Input value={trustUserId} onChange={(event) => setTrustUserId(event.target.value)} placeholder="profile uuid" />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Verification status
                <select
                  value={verificationStatus}
                  onChange={(event) => setVerificationStatus(event.target.value as Database["public"]["Enums"]["verification_status"])}
                  className="h-11 rounded-lg border bg-background px-3 text-sm"
                >
                  {verificationStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
                </select>
              </label>
              <Button className="w-fit" disabled={busyAction === "verify" || !currentData.isStaff} onClick={verifyUser}>
                Обновить верификацию
              </Button>
              <label className="grid gap-2 text-sm font-medium">
                Block reason
                <Textarea value={blockReason} onChange={(event) => setBlockReason(event.target.value)} />
              </label>
              <Button className="w-fit" variant="destructive" disabled={!currentData.isAdmin || !trustUserId.trim()} onClick={() => blockUser(trustUserId)}>
                <UserX className="h-4 w-4" />
                Заблокировать пользователя
              </Button>
              {!currentData.isAdmin ? (
                <p className="text-sm text-muted-foreground">Блокировка требует role admin. Верификация доступна moderator/admin.</p>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
