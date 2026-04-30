"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Camera, Check, HandCoins, ImagePlus, MessageSquare, Send, ShieldAlert, Truck, X } from "lucide-react";
import type { Conversation, Deal, ID, Listing, Message, Offer } from "@/lib/domain";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { useSupabaseSession } from "@/features/auth/components/use-supabase-session";
import {
  acceptSupabaseOffer,
  confirmSupabaseDealCompleted,
  counterSupabaseOffer,
  createSupabaseOffer,
  declineSupabaseOffer,
  loadSupabaseConversations,
  loadSupabaseThread,
  markSupabaseDealShipped,
  sendSupabaseImageAttachment,
  sendSupabaseMessage,
  subscribeToSupabaseThread
} from "@/features/chat/lib/supabase-chat";
import { createSupabaseComplaint } from "@/features/moderation/lib/supabase-moderation";
import { STATUS_TONE } from "@/lib/theme";
import { cn } from "@/lib/utils/cn";
import { formatMoney, formatRelativeDate } from "@/lib/utils/format";
import { listingStatusLabel, offerStatusLabel } from "@/lib/utils/labels";

type ThreadState = {
  conversation: Conversation | null;
  deal: Deal | null;
  listing: Listing | null;
  messages: Message[];
  offers: Offer[];
};

type SupabaseChatScreenProps = {
  initialConversationId?: string;
};

export function SupabaseChatScreen({ initialConversationId }: SupabaseChatScreenProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { loading: sessionLoading, user } = useSupabaseSession();
  const [conversationLoading, setConversationLoading] = React.useState(true);
  const [threadLoading, setThreadLoading] = React.useState(false);
  const [conversations, setConversations] = React.useState<Conversation[]>([]);
  const [listingsById, setListingsById] = React.useState<Record<ID, Listing>>({});
  const [selectedId, setSelectedId] = React.useState(initialConversationId ?? "");
  const [thread, setThread] = React.useState<ThreadState>({
    conversation: null,
    deal: null,
    listing: null,
    messages: [],
    offers: []
  });
  const [messageText, setMessageText] = React.useState("");
  const [offerAmount, setOfferAmount] = React.useState("");
  const [offerMessage, setOfferMessage] = React.useState("Готов забрать сегодня, если цена подойдет.");
  const [busyAction, setBusyAction] = React.useState<string | null>(null);
  const photoInputRef = React.useRef<HTMLInputElement | null>(null);

  const selected = conversations.find((conversation) => conversation.id === selectedId) ?? thread.conversation;
  const listing = selected ? listingsById[selected.listingId] ?? thread.listing : thread.listing;
  const deal = thread.deal;
  const currentUserId = user?.id ?? "";
  const canCreateOffer = Boolean(selected && selected.buyerId === currentUserId);
  const acceptedOffer = thread.offers.find((offer) => offer.status === "accepted");
  const lowball = listing ? Number(offerAmount) > 0 && Number(offerAmount) < listing.price.amount * 0.75 : false;
  const sellerCanMarkShipped = Boolean(deal && deal.sellerId === currentUserId && deal.status !== "completed" && deal.status !== "cancelled" && deal.status !== "in_transit");
  const buyerCanComplete = Boolean(deal && deal.buyerId === currentUserId && deal.status !== "completed" && deal.status !== "cancelled");

  const reloadConversations = React.useCallback(async () => {
    setConversationLoading(true);

    try {
      const bundle = await loadSupabaseConversations();
      setConversations(bundle.conversations);
      setListingsById((current) => ({ ...current, ...bundle.listingsById }));

      setSelectedId((current) => {
        if (initialConversationId) {
          return initialConversationId;
        }

        if (current && bundle.conversations.some((conversation) => conversation.id === current)) {
          return current;
        }

        return bundle.conversations[0]?.id ?? "";
      });
    } catch (error) {
      toast({
        title: "Не удалось загрузить диалоги",
        description: error instanceof Error ? error.message : "Supabase вернул ошибку."
      });
    } finally {
      setConversationLoading(false);
    }
  }, [initialConversationId, toast]);

  const reloadThread = React.useCallback(
    async (conversationId: ID) => {
      setThreadLoading(true);

      try {
        const data = await loadSupabaseThread(conversationId);
        setThread(data);
        const dataListing = data.listing;
        const dataConversation = data.conversation;

        if (dataListing) {
          setListingsById((current) => ({ ...current, [dataListing.id]: dataListing }));
        }

        if (dataConversation) {
          setConversations((current) => upsertById(current, dataConversation));
        }
      } catch (error) {
        toast({
          title: "Не удалось загрузить переписку",
          description: error instanceof Error ? error.message : "Supabase вернул ошибку."
        });
      } finally {
        setThreadLoading(false);
      }
    },
    [toast]
  );

  React.useEffect(() => {
    if (initialConversationId) {
      setSelectedId(initialConversationId);
    }
  }, [initialConversationId]);

  React.useEffect(() => {
    if (sessionLoading) {
      return;
    }

    if (!user) {
      setConversationLoading(false);
      return;
    }

    void reloadConversations();
  }, [reloadConversations, sessionLoading, user]);

  React.useEffect(() => {
    if (!selectedId || !user) {
      return;
    }

    void reloadThread(selectedId);
  }, [reloadThread, selectedId, user]);

  React.useEffect(() => {
    if (!selectedId || !user) {
      return;
    }

    return subscribeToSupabaseThread(selectedId, {
      onMessage: (message) => {
        setThread((current) => ({
          ...current,
          messages: upsertById(current.messages, message).sort(sortByCreatedAt)
        }));
      },
      onOfferChange: (offer) => {
        setThread((current) => ({
          ...current,
          offers: upsertById(current.offers, offer).sort(sortOffersNewestFirst)
        }));

        if (offer.status === "accepted") {
          void reloadThread(selectedId);
        }
      },
      onDealChange: (nextDeal) => {
        setThread((current) => ({
          ...current,
          deal: nextDeal
        }));
      }
    });
  }, [reloadThread, selectedId, user]);

  function selectConversation(conversation: Conversation) {
    setSelectedId(conversation.id);
    router.replace(`/chat/${conversation.id}`);
  }

  async function submitMessage(text = messageText) {
    if (!selected || !text.trim()) {
      return;
    }

    setBusyAction("message");

    try {
      const message = await sendSupabaseMessage(selected.id, text.trim());
      setThread((current) => ({
        ...current,
        messages: upsertById(current.messages, message).sort(sortByCreatedAt)
      }));
      setMessageText("");
    } catch (error) {
      toast({
        title: "Сообщение не отправлено",
        description: error instanceof Error ? error.message : "Попробуйте еще раз."
      });
    } finally {
      setBusyAction(null);
    }
  }

  async function submitImageAttachment(file: File) {
    if (!selected) {
      return;
    }

    setBusyAction("image");

    try {
      const message = await sendSupabaseImageAttachment(selected.id, file);
      setThread((current) => ({
        ...current,
        messages: upsertById(current.messages, message).sort(sortByCreatedAt)
      }));
      toast({ title: "Фото отправлено", description: "Изображение добавлено в переписку." });
    } catch (error) {
      toast({
        title: "Фото не отправлено",
        description: error instanceof Error ? error.message : "Попробуйте еще раз."
      });
    } finally {
      setBusyAction(null);
    }
  }

  async function submitOffer() {
    if (!selected || !listing) {
      return;
    }

    const amount = Number(offerAmount);

    if (!Number.isFinite(amount) || amount <= 0) {
      toast({ title: "Укажите цену", description: "Оффер должен быть положительным числом." });
      return;
    }

    setBusyAction("offer");

    try {
      const offer = await createSupabaseOffer(selected, amount, offerMessage);
      setThread((current) => ({
        ...current,
        offers: upsertById(current.offers, offer).sort(sortOffersNewestFirst)
      }));
      setOfferAmount("");
      toast({ title: "Оффер отправлен", description: "Продавец увидит предложение в этом диалоге." });
      void reloadThread(selected.id);
    } catch (error) {
      toast({
        title: "Оффер не отправлен",
        description: error instanceof Error ? error.message : "Попробуйте еще раз."
      });
    } finally {
      setBusyAction(null);
    }
  }

  async function updateOffer(offer: Offer, status: "accepted" | "declined" | "countered") {
    if (!selected) {
      return;
    }

    setBusyAction(`${offer.id}:${status}`);

    try {
      const next =
        status === "accepted"
          ? await acceptSupabaseOffer(offer.id)
          : status === "declined"
            ? await declineSupabaseOffer(offer.id)
            : await counterSupabaseOffer(offer.id, selected.id);

      setThread((current) => ({
        ...current,
        offers: upsertById(current.offers, next).sort(sortOffersNewestFirst)
      }));

      if (status === "accepted") {
        toast({ title: "Оффер принят", description: "Сделка создана автоматически, товар переведен в резерв." });
      } else if (status === "declined") {
        toast({ title: "Оффер отклонен" });
      } else {
        toast({ title: "Контр-оффер отмечен", description: "Для MVP фиксируем статус в рамках диалога." });
      }

      void reloadThread(selected.id);
      void reloadConversations();
    } catch (error) {
      toast({
        title: "Статус оффера не обновлен",
        description: error instanceof Error ? error.message : "Попробуйте еще раз."
      });
    } finally {
      setBusyAction(null);
    }
  }

  async function markShipped() {
    if (!selected) {
      return;
    }

    setBusyAction("deal:shipped");

    try {
      const nextDeal = await markSupabaseDealShipped(selected.id);
      setThread((current) => ({ ...current, deal: nextDeal }));
      toast({ title: "Товар отправлен", description: "Покупатель увидит обновление прямо в чате." });
      void reloadThread(selected.id);
    } catch (error) {
      toast({
        title: "Статус не обновлен",
        description: error instanceof Error ? error.message : "Попробуйте еще раз."
      });
    } finally {
      setBusyAction(null);
    }
  }

  async function confirmDealCompleted() {
    if (!selected) {
      return;
    }

    setBusyAction("deal:completed");

    try {
      const nextDeal = await confirmSupabaseDealCompleted(selected.id);
      setThread((current) => ({ ...current, deal: nextDeal }));
      toast({ title: "Сделка завершена", description: "Товар отмечен как проданный, можно оставить отзыв." });
      void reloadThread(selected.id);
      void reloadConversations();
    } catch (error) {
      toast({
        title: "Не удалось завершить сделку",
        description: error instanceof Error ? error.message : "Попробуйте еще раз."
      });
    } finally {
      setBusyAction(null);
    }
  }

  async function reportDealIssue() {
    if (!selected) {
      return;
    }

    setBusyAction("deal:complaint");

    try {
      await createSupabaseComplaint({
        targetType: "conversation",
        targetId: selected.id,
        reason: "other",
        details: "Нужна помощь модерации по текущей сделке."
      });
      toast({ title: "Обращение отправлено", description: "Модерация подключится к спорной ситуации." });
    } catch (error) {
      toast({
        title: "Не удалось отправить обращение",
        description: error instanceof Error ? error.message : "Попробуйте еще раз."
      });
    } finally {
      setBusyAction(null);
    }
  }

  if (sessionLoading || conversationLoading) {
    return (
      <div className="grid gap-4 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <Skeleton className="h-[32rem]" />
        <Skeleton className="h-[32rem]" />
      </div>
    );
  }

  if (!user) {
    return (
      <EmptyState
        title="Войдите, чтобы открыть чат"
        description="Диалоги, офферы и резерв товара доступны авторизованным пользователям."
        actionLabel="Войти"
        actionHref="/auth/sign-in?redirectTo=/chat"
        icon={<MessageSquare className="h-6 w-6" />}
      />
    );
  }

  if (!conversations.length && !selectedId) {
    return (
      <EmptyState
        title="Диалогов пока нет"
        description="Откройте объявление и нажмите «Написать», чтобы начать диалог с продавцом."
        actionLabel="В каталог"
        actionHref="/"
        icon={<MessageSquare className="h-6 w-6" />}
      />
    );
  }

  return (
    <div className="grid min-w-0 gap-4 lg:h-[calc(100dvh-7rem)] lg:grid-cols-[15rem_minmax(0,1fr)] xl:grid-cols-[16rem_minmax(0,1fr)]">
      <Card className="min-w-0 overflow-hidden bg-card/94 lg:h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Диалоги
          </CardTitle>
        </CardHeader>
        <CardContent className="flex gap-3 overflow-x-auto p-4 pt-0 lg:grid lg:max-h-[calc(100%-5rem)] lg:overflow-y-auto lg:overflow-x-hidden">
          {conversations.map((conversation) => {
            const itemListing = listingsById[conversation.listingId];
            const active = conversation.id === selected?.id;

            return (
              <button
                key={conversation.id}
                className={cn(
                  "w-64 shrink-0 rounded-lg border bg-background p-3 text-left transition hover:bg-muted lg:w-auto",
                  active && "border-primary bg-primary/10"
                )}
                onClick={() => selectConversation(conversation)}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="line-clamp-1 font-semibold">{itemListing?.title ?? "Диалог"}</span>
                  {conversation.unreadCount ? <Badge variant="secondary">{conversation.unreadCount}</Badge> : null}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{formatRelativeDate(conversation.lastMessageAt)}</p>
              </button>
            );
          })}
        </CardContent>
      </Card>

      <section className="grid min-h-0 min-w-0 gap-4 lg:h-full lg:grid-rows-[auto_minmax(0,1fr)]">
        {selected && listing ? (
          <>
            <Card className="min-w-0 overflow-hidden bg-card/94">
              <CardContent className="grid gap-4 p-4 md:grid-cols-[auto_1fr_auto] md:items-center">
                <div className="relative h-20 w-20 overflow-hidden rounded-lg bg-muted">
                  {listing.images[0] ? (
                    <Image src={listing.images[0].url} alt={listing.images[0].alt} fill className="object-cover" sizes="80px" />
                  ) : null}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/listings/${listing.id}`} className="line-clamp-1 font-semibold hover:text-primary">
                      {listing.title}
                    </Link>
                    <Badge variant={STATUS_TONE[listing.status]}>{listingStatusLabel[listing.status]}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{formatMoney(listing.price)}</p>
                  {deal ? (
                    <p className="mt-2 text-sm text-muted-foreground">
                      Сделка активна: все ключевые обновления и подтверждения происходят внутри этого чата.
                    </p>
                  ) : acceptedOffer ? (
                    <p className="mt-2 text-sm text-muted-foreground">
                      Оффер принят. Сделка создана автоматически, можно согласовать отправку и подтверждение.
                    </p>
                  ) : null}
                </div>
                {sellerCanMarkShipped ? (
                  <Button variant="secondary" disabled={busyAction === "deal:shipped"} onClick={markShipped}>
                    <Truck className="h-4 w-4" />
                    Товар отправлен
                  </Button>
                ) : buyerCanComplete ? (
                  <Button variant="secondary" disabled={busyAction === "deal:completed"} onClick={confirmDealCompleted}>
                    Сделка состоялась
                  </Button>
                ) : null}
              </CardContent>
            </Card>

            <div className="grid min-h-0 min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_17rem] 2xl:grid-cols-[minmax(0,1fr)_18rem]">
              <Card className="flex h-[calc(100dvh-19rem)] min-h-[34rem] min-w-0 flex-col overflow-hidden bg-card/94 lg:h-full lg:min-h-0">
                <CardContent className="flex min-h-0 flex-1 flex-col p-0">
                  <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
                    {threadLoading ? (
                      <div className="space-y-3">
                        <Skeleton className="h-14 w-2/3" />
                        <Skeleton className="ml-auto h-16 w-3/5" />
                        <Skeleton className="h-12 w-1/2" />
                      </div>
                    ) : thread.messages.length ? (
                      thread.messages.map((message) => (
                        <MessageBubble key={message.id} message={message} currentUserId={currentUserId} />
                      ))
                    ) : (
                      <div className="flex h-full items-center justify-center text-center text-sm text-muted-foreground">
                        Напишите первое сообщение по этому объявлению.
                      </div>
                    )}
                  </div>
                  <div className="shrink-0 border-t p-3 sm:p-4">
                    <div className="grid min-w-0 gap-2 sm:grid-cols-[auto_minmax(0,1fr)_auto]">
                      <input
                        ref={photoInputRef}
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) {
                            void submitImageAttachment(file);
                          }
                          event.currentTarget.value = "";
                        }}
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        aria-label="Фото"
                        disabled={busyAction === "image"}
                        onClick={() => photoInputRef.current?.click()}
                      >
                        <ImagePlus className="h-4 w-4" />
                      </Button>
                      <Input
                        value={messageText}
                        onChange={(event) => setMessageText(event.target.value)}
                        placeholder="Напишите сообщение"
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            void submitMessage();
                          }
                        }}
                      />
                      <Button size="sm" className="w-full px-3 sm:w-auto" disabled={busyAction === "message"} onClick={() => submitMessage()}>
                        <Send className="h-4 w-4" />
                        Отправить
                      </Button>
                    </div>
                    {deal?.status === "completed" ? (
                      <div className="mt-3 rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
                        Если после завершения сделки возникла спорная ситуация, можно подключить модерацию.
                        <div className="mt-3">
                          <Button variant="outline" size="sm" disabled={busyAction === "deal:complaint"} onClick={reportDealIssue}>
                            <ShieldAlert className="h-4 w-4" />
                            Написать в модерацию
                          </Button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </CardContent>
              </Card>

              <aside className="min-w-0 overflow-hidden xl:h-full xl:overflow-y-auto">
                <Card className="bg-card/94">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <HandCoins className="h-5 w-5 text-primary" />
                      Офферы
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-3">
                    <Input
                      value={offerAmount}
                      onChange={(event) => setOfferAmount(event.target.value)}
                      inputMode="numeric"
                      placeholder={`${Math.max(1, listing.price.amount - 80)}`}
                    />
                    {lowball ? (
                      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-900 dark:border-yellow-500/40 dark:bg-yellow-500/15 dark:text-yellow-100">
                        Это слишком низкое предложение. Лучше коротко пояснить причину своей цены.
                      </div>
                    ) : null}
                    <Textarea value={offerMessage} onChange={(event) => setOfferMessage(event.target.value)} />
                    {!canCreateOffer ? (
                      <p className="rounded-lg border bg-muted/50 p-3 text-sm text-muted-foreground">
                        Оффер отправляет покупатель. Продавец может принять предложение, отклонить его или ответить встречной ценой.
                      </p>
                    ) : null}
                    <Button disabled={busyAction === "offer" || !canCreateOffer} onClick={submitOffer}>
                      Создать оффер
                    </Button>
                    <div className="grid gap-2">
                      {thread.offers.length ? (
                        thread.offers.map((offer) => (
                          <OfferRow
                            key={offer.id}
                            offer={offer}
                            currentUserId={currentUserId}
                            busyAction={busyAction}
                            onStatus={updateOffer}
                          />
                        ))
                      ) : (
                        <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
                          Офферов пока нет. Как только кто-то предложит цену, история появится здесь.
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </aside>
            </div>
          </>
        ) : (
          <EmptyState
            title="Выберите диалог"
            description="Откройте диалог слева, чтобы увидеть переписку, офферы и статус сделки."
            icon={<MessageSquare className="h-6 w-6" />}
          />
        )}
      </section>
    </div>
  );
}

function MessageBubble({ message, currentUserId }: { message: Message; currentUserId: string }) {
  const mine = message.senderId === currentUserId;
  const system = message.type === "system";

  if (system) {
    return <div className="mx-auto max-w-md rounded-lg bg-muted px-3 py-2 text-center text-xs text-muted-foreground">{message.text}</div>;
  }

  return (
    <div className={mine ? "flex justify-end" : "flex justify-start"}>
      <div
        className={cn(
          "max-w-[88%] break-words rounded-lg px-4 py-3",
          mine ? "bg-primary text-primary-foreground" : "border bg-background"
        )}
      >
        <div className="mb-2 flex items-center gap-2">
          {!mine ? (
            <Avatar className="h-6 w-6">
              <AvatarFallback>P</AvatarFallback>
            </Avatar>
          ) : null}
          <span className="text-xs opacity-75">{formatRelativeDate(message.createdAt)}</span>
        </div>
        {message.type === "attachment" ? (
          <div className="grid gap-2">
            {message.attachment.type === "image" && message.attachment.url ? (
              <div className="relative h-48 w-full overflow-hidden rounded-lg bg-muted">
                <Image src={message.attachment.url} alt={message.attachment.alt ?? "Фото"} fill className="object-cover" sizes="(max-width: 768px) 100vw, 40vw" />
              </div>
            ) : null}
            <div className="flex items-center gap-2">
              <Camera className="h-4 w-4" />
              <span>{message.text ?? "Вложение"}</span>
            </div>
          </div>
        ) : (
          <p className="text-sm leading-6">{message.text}</p>
        )}
        <div className="mt-1 text-right text-[11px] opacity-70">{message.status}</div>
      </div>
    </div>
  );
}

function OfferRow({
  offer,
  currentUserId,
  busyAction,
  onStatus
}: {
  offer: Offer;
  currentUserId: ID;
  busyAction: string | null;
  onStatus: (offer: Offer, status: "accepted" | "declined" | "countered") => Promise<void>;
}) {
  const canModerateOffer = offer.status === "sent" && offer.sellerId === currentUserId;

  return (
    <div className="rounded-lg border bg-background p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="font-semibold">{formatMoney(offer.amount)}</p>
        <Badge variant={offer.status === "accepted" ? "success" : offer.status === "declined" ? "danger" : "accent"}>
          {offerStatusLabel[offer.status]}
        </Badge>
      </div>
      {offer.message ? <p className="mt-2 text-sm text-muted-foreground">{offer.message}</p> : null}
      {canModerateOffer ? (
        <div className="mt-3 grid grid-cols-3 gap-2">
          <Button size="sm" disabled={busyAction === `${offer.id}:accepted`} onClick={() => onStatus(offer, "accepted")}>
            <Check className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline" disabled={busyAction === `${offer.id}:countered`} onClick={() => onStatus(offer, "countered")}>
            ↔
          </Button>
          <Button size="sm" variant="destructive" disabled={busyAction === `${offer.id}:declined`} onClick={() => onStatus(offer, "declined")}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : null}
      {offer.status === "accepted" ? (
        <p className="mt-2 text-xs text-muted-foreground">Товар переведен в резерв, остальные sent-офферы в этом диалоге отклоняются.</p>
      ) : null}
    </div>
  );
}

function upsertById<T extends { id: ID }>(items: T[], item: T) {
  return items.some((current) => current.id === item.id)
    ? items.map((current) => (current.id === item.id ? item : current))
    : [...items, item];
}

function sortByCreatedAt(a: Message, b: Message) {
  return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
}

function sortOffersNewestFirst(a: Offer, b: Offer) {
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}
