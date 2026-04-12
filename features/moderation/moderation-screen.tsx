"use client";

import * as React from "react";
import Link from "next/link";
import { Flag, ShieldAlert, ShieldCheck } from "lucide-react";
import type { Complaint } from "@/lib/domain";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { usePineStore } from "@/lib/mock/use-pine-store";
import { formatRelativeDate } from "@/lib/utils/format";
import { complaintStatusLabel, listingStatusLabel, moderationStatusLabel } from "@/lib/utils/labels";
import { STATUS_TONE } from "@/lib/theme";

const reasons: Complaint["reason"][] = ["spam", "fraud", "prohibited_item", "abuse", "other"];

export function ModerationScreen() {
  const { toast } = useToast();
  const listings = usePineStore((state) => state.listings);
  const complaints = usePineStore((state) => state.complaints);
  const moderationCases = usePineStore((state) => state.moderationCases);
  const createComplaint = usePineStore((state) => state.createComplaint);
  const moderateListing = usePineStore((state) => state.moderateListing);
  const [targetId, setTargetId] = React.useState(listings[0]?.id ?? "");
  const [reason, setReason] = React.useState<Complaint["reason"]>("other");
  const [details, setDetails] = React.useState("");
  const [moderationNotes, setModerationNotes] = React.useState<Record<string, string>>({});

  function submit() {
    if (!details.trim()) {
      toast({ title: "Добавьте детали", description: "Короткого описания достаточно." });
      return;
    }

    createComplaint({ targetType: "listing", targetId, reason, details });
    setDetails("");
    toast({ title: "Жалоба создана", description: "Статус можно отслеживать в этом кабинете." });
  }

  function decide(listingId: string, decision: "approved" | "needs_changes" | "rejected") {
    moderateListing(listingId, decision, moderationNotes[listingId]);
    toast({
      title: decision === "approved" ? "Объявление опубликовано" : "Статус модерации обновлен",
      description:
        decision === "approved"
          ? "Теперь объявление видно в каталоге."
          : "Комментарий сохранен для seller feedback."
    });
  }

  return (
    <div className="grid gap-6">
      <Card className="bg-white/92">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Trust & Safety
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-6 text-muted-foreground">
            Жалобы, статусы модерации и feedback продавцу работают локально и повторяют будущий admin workflow.
          </p>
        </CardContent>
      </Card>

      <Tabs defaultValue="complaints">
        <TabsList>
          <TabsTrigger value="complaints">Жалобы</TabsTrigger>
          <TabsTrigger value="cases">Модерация объявлений</TabsTrigger>
          <TabsTrigger value="report">Создать жалобу</TabsTrigger>
        </TabsList>

        <TabsContent value="complaints">
          <div className="grid gap-3">
            {complaints.map((complaint) => (
              <Card key={complaint.id} className="bg-white/92">
                <CardContent className="grid gap-3 p-4 md:grid-cols-[1fr_auto] md:items-center">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="warning">{complaintStatusLabel[complaint.status]}</Badge>
                      <Badge variant="outline" className="bg-white">{complaint.reason}</Badge>
                    </div>
                    <p className="mt-2 font-semibold">{complaint.details}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{formatRelativeDate(complaint.createdAt)}</p>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/listings/${complaint.targetId}`}>Открыть target</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="cases">
          <div className="grid gap-3">
            {moderationCases.map((item) => {
              const listing = listings.find((listing) => listing.id === item.listingId);
              return (
                <Card key={item.id} className="bg-white/92">
                  <CardContent className="grid gap-4 p-4">
                    <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-start">
                      <div>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant={item.status === "approved" ? "success" : item.status === "rejected" ? "danger" : "warning"}>
                            {moderationStatusLabel[item.status]}
                          </Badge>
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
                        <Button size="sm" onClick={() => decide(item.listingId, "approved")}>
                          Одобрить и опубликовать
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => decide(item.listingId, "needs_changes")}>
                          Нужны правки
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => decide(item.listingId, "rejected")}>
                          Отклонить
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="report">
          <Card className="bg-white/92">
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
                <select value={reason} onChange={(event) => setReason(event.target.value as Complaint["reason"])} className="h-11 rounded-lg border bg-white px-3 text-sm">
                  {reasons.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Детали
                <Textarea value={details} onChange={(event) => setDetails(event.target.value)} />
              </label>
              <Button onClick={submit}>
                <ShieldAlert className="h-4 w-4" />
                Отправить
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
