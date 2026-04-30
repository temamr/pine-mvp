"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowDown, Check, HandCoins, ImagePlus, MessageSquare, Send, ShieldAlert, Trash2, Truck, X } from "lucide-react";
import type { Conversation, Deal, ID, Listing, Message, Offer, User } from "@/lib/domain";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { useSupabaseSession } from "@/features/auth/components/use-supabase-session";
import {
  acceptSupabaseOffer,
  confirmSupabaseDealCompleted,
  createSupabaseOffer,
  createSupabaseCounterOffer,
  declineSupabaseOffer,
  hideSupabaseConversation,
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
  counterpart: User | null;
  messages: Message[];
  offers: Offer[];
};

type SupabaseChatScreenProps = {
  initialConversationId?: string;
};

export function SupabaseChatScreen({ initialConversationId }: SupabaseChatScreenProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { loading: sessionLoading, user, profile } = useSupabaseSession();
  const [conversationLoading, setConversationLoading] = React.useState(true);
  const [threadLoading, setThreadLoading] = React.useState(false);
  const [conversations, setConversations] = React.useState<Conversation[]>([]);
  const [listingsById, setListingsById] = React.useState<Record<ID, Listing>>({});
  const [selectedId, setSelectedId] = React.useState(initialConversationId ?? "");
  const [thread, setThread] = React.useState<ThreadState>({
    conversation: null,
    deal: null,
    listing: null,
    counterpart: null,
    messages: [],
    offers: []
  });
  const [messageText, setMessageText] = React.useState("");
  const [offerAmount, setOfferAmount] = React.useState("");
  const [offerMessage, setOfferMessage] = React.useState("Готов забрать сегодня, если цена подойдет.");
  const [busyAction, setBusyAction] = React.useState<string | null>(null);
  const [pendingDeleteConversationId, setPendingDeleteConversationId] = React.useState<ID | null>(null);
  const photoInputRef = React.useRef<HTMLInputElement | null>(null);
  const messagesRef = React.useRef<HTMLDivElement | null>(null);
  const [showScrollToBottom, setShowScrollToBottom] = React.useState(false);

  const selected = conversations.find((conversation) => conversation.id === selectedId) ?? thread.conversation;
  const listing = selected ? listingsById[selected.listingId] ?? thread.listing : thread.listing;
  const deal = thread.deal;
  const counterpart = thread.counterpart;
  const currentUserId = user?.id ?? "";
  const canCreateOffer = Boolean(selected && selected.buyerId === currentUserId);
  const acceptedOffer = thread.offers.find((offer) => offer.status === "accepted");
  const pendingIncomingOffer = thread.offers.find((offer) => offer.status === "sent" && offer.sellerId === currentUserId);
  const hasAnyOffer = thread.offers.length > 0;
  const lowball = listing ? Number(offerAmount) > 0 && Number(offerAmount) < listing.price.amount * 0.75 : false;
  const sellerCanMarkShipped = Boolean(deal && deal.sellerId === currentUserId && deal.status !== "completed" && deal.status !== "cancelled" && deal.status !== "in_transit");
  const buyerCanComplete = Boolean(deal && deal.buyerId === currentUserId && deal.status !== "completed" && deal.status !== "cancelled");
  const canHideConversation = Boolean(selected && selected.status !== "deal_started");
  const pendingDeleteConversation = conversations.find((conversation) => conversation.id === pendingDeleteConversationId) ?? null;

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

  React.useEffect(() => {
    const node = messagesRef.current;

    if (!node) {
      return;
    }

    const handleScroll = () => {
      const offset = node.scrollHeight - node.scrollTop - node.clientHeight;
      setShowScrollToBottom(offset > 120);
    };

    handleScroll();
    node.addEventListener("scroll", handleScroll);
    return () => node.removeEventListener("scroll", handleScroll);
  }, [selectedId, thread.messages.length]);

  React.useEffect(() => {
    const node = messagesRef.current;

    if (!node) {
      return;
    }

    const offset = node.scrollHeight - node.scrollTop - node.clientHeight;
    if (offset < 180) {
      node.scrollTop = node.scrollHeight;
    }
  }, [thread.messages]);

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
      toast({ title: "Фото отправлено" });
    } catch (error) {
      toast({
        title: "Фото не отправлено",
        description: error instanceof Error ? error.message : "Попробуйте еще раз."
      });
    } finally {
      setBusyAction(null);
    }
  }

  async function submitCounterOffer() {
    if (!pendingIncomingOffer) {
      return;
    }
    const conversationId = selected?.id;

    const amount = Number(offerAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast({ title: "Укажите цену", description: "Контр-оффер должен быть положительным числом." });
      return;
    }

    setBusyAction("counter-offer");

    try {
      const offer = await createSupabaseCounterOffer(pendingIncomingOffer.id, amount, offerMessage);
      setThread((current) => ({
        ...current,
        offers: upsertById(current.offers, offer).sort(sortOffersNewestFirst)
      }));
      setOfferAmount("");
      toast({ title: "Контр-оффер отправлен", description: "Покупатель увидит новую цену в диалоге." });
      if (conversationId) {
        void reloadThread(conversationId);
      }
    } catch (error) {
      toast({
        title: "Контр-оффер не отправлен",
        description: error instanceof Error ? error.message : "Попробуйте еще раз."
      });
    } finally {
      setBusyAction(null);
    }
  }

  async function hideConversation(conversationId?: ID) {
    const targetId = conversationId ?? selected?.id;

    if (!targetId) {
      return;
    }

    setBusyAction("hide-conversation");

    try {
      await hideSupabaseConversation(targetId);
      toast({ title: "Чат скрыт", description: "Диалог убран из вашего списка." });
      if (selected?.id === targetId) {
        setSelectedId("");
        setThread({
          conversation: null,
          deal: null,
          listing: null,
          counterpart: null,
          messages: [],
          offers: []
        });
      }
      setPendingDeleteConversationId(null);
      void reloadConversations();
      if (selected?.id === targetId) {
        router.replace("/chat");
      }
    } catch (error) {
      toast({
        title: "Не удалось скрыть чат",
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
    const conversationId = selected.id;

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
      void reloadThread(conversationId);
    } catch (error) {
      toast({
        title: "Оффер не отправлен",
        description: error instanceof Error ? error.message : "Попробуйте еще раз."
      });
    } finally {
      setBusyAction(null);
    }
  }

  async function updateOffer(offer: Offer, status: "accepted" | "declined") {
    if (!selected) {
      return;
    }
    const conversationId = selected.id;

    setBusyAction(`${offer.id}:${status}`);

    try {
      const next = status === "accepted" ? await acceptSupabaseOffer(offer.id) : await declineSupabaseOffer(offer.id);

      setThread((current) => ({
        ...current,
        offers: upsertById(current.offers, next).sort(sortOffersNewestFirst)
      }));

      if (status === "accepted") {
        toast({ title: "Оффер принят", description: "Сделка создана автоматически, товар переведен в резерв." });
      } else {
        toast({ title: "Оффер отклонен" });
      }

      void reloadThread(conversationId);
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
    const conversationId = selected.id;

    setBusyAction("deal:shipped");

    try {
      const nextDeal = await markSupabaseDealShipped(selected.id);
      setThread((current) => ({ ...current, deal: nextDeal }));
      toast({ title: "Товар отправлен", description: "Покупатель увидит обновление прямо в чате." });
      void reloadThread(conversationId);
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
    const conversationId = selected.id;

    setBusyAction("deal:completed");

    try {
      const nextDeal = await confirmSupabaseDealCompleted(selected.id);
      setThread((current) => ({ ...current, deal: nextDeal }));
      toast({ title: "Сделка завершена", description: "Товар отмечен как проданный, можно оставить отзыв." });
      void reloadThread(conversationId);
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
    <>
      <Dialog open={Boolean(pendingDeleteConversationId)} onOpenChange={(open) => !open && setPendingDeleteConversationId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Удалить чат?</DialogTitle>
            <DialogDescription>
              {pendingDeleteConversation
                ? `Диалог по объявлению «${listingsById[pendingDeleteConversation.listingId]?.title ?? "без названия"}» исчезнет только из вашего списка.`
                : "Диалог исчезнет только из вашего списка."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingDeleteConversationId(null)}>
              Отмена
            </Button>
            <Button
              variant="destructive"
              disabled={busyAction === "hide-conversation"}
              onClick={() => void hideConversation(pendingDeleteConversationId ?? undefined)}
            >
              <Trash2 className="h-4 w-4" />
              Удалить чат
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
            const itemCanHide = conversation.status !== "deal_started";

            return (
              <div
                key={conversation.id}
                className={cn(
                  "group relative w-64 shrink-0 rounded-lg border bg-background transition hover:bg-muted lg:w-auto",
                  active && "border-primary bg-primary/10"
                )}
              >
                <button className="w-full p-3 pr-12 text-left" onClick={() => selectConversation(conversation)}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="line-clamp-1 font-semibold">{itemListing?.title ?? "Диалог"}</span>
                    {conversation.unreadCount ? <Badge variant="secondary">{conversation.unreadCount}</Badge> : null}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{formatRelativeDate(conversation.lastMessageAt)}</p>
                </button>
                {itemCanHide ? (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="absolute right-2 top-2 h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                    aria-label="Удалить чат"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      setPendingDeleteConversationId(conversation.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                ) : null}
              </div>
            );
          })}
        </CardContent>
      </Card>

      <section className="grid min-h-0 min-w-0 gap-4 lg:h-full lg:grid-rows-[auto_minmax(0,1fr)]">
        {selected && listing ? (
          <>
            <Card className="min-w-0 overflow-hidden bg-card/94">
              <CardContent className="grid gap-4 p-4 md:grid-cols-[auto_1fr_auto] md:items-start">
                <div className="relative h-20 w-20 self-start overflow-hidden rounded-lg bg-muted">
                  {listing.images[0] ? (
                    <Image src={listing.images[0].url} alt={listing.images[0].alt} fill className="object-cover object-top" sizes="80px" />
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
                  {counterpart ? (
                    <Link href={`/users/${counterpart.id}`} className="mt-4 flex w-fit items-center gap-3 text-sm hover:text-primary">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={counterpart.avatarUrl} />
                        <AvatarFallback>{counterpart.displayName.slice(0, 2)}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{counterpart.displayName}</span>
                    </Link>
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
              <Card className="relative flex h-[calc(100dvh-19rem)] min-h-[34rem] min-w-0 flex-col overflow-hidden bg-card/94 lg:h-full lg:min-h-0">
                <CardContent className="flex min-h-0 flex-1 flex-col p-0">
                  <div ref={messagesRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
                    {threadLoading ? (
                      <div className="space-y-3">
                        <Skeleton className="h-14 w-2/3" />
                        <Skeleton className="ml-auto h-16 w-3/5" />
                        <Skeleton className="h-12 w-1/2" />
                      </div>
                    ) : thread.messages.length ? (
                      thread.messages.map((message) => (
                        <MessageBubble
                          key={message.id}
                          message={message}
                          currentUserId={currentUserId}
                          currentUserName={profile?.display_name ?? "Вы"}
                          currentUserAvatar={profile?.avatar_url ?? undefined}
                          counterpartName={counterpart?.displayName ?? "Собеседник"}
                          counterpartAvatar={counterpart?.avatarUrl}
                        />
                      ))
                    ) : (
                      <div className="flex h-full items-center justify-center text-center text-sm text-muted-foreground">
                        Напишите первое сообщение по этому объявлению.
                      </div>
                    )}
                    {deal?.status === "completed" ? (
                      <div className="mx-auto max-w-md rounded-lg border border-dashed bg-background/90 px-4 py-3 text-center text-xs text-muted-foreground">
                        Если после завершения сделки возник спор, можно подключить модерацию.
                        <div className="mt-3">
                          <Button variant="outline" size="sm" disabled={busyAction === "deal:complaint"} onClick={reportDealIssue}>
                            <ShieldAlert className="h-4 w-4" />
                            Написать в модерацию
                          </Button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                  {showScrollToBottom ? (
                    <div className="pointer-events-none absolute bottom-24 right-4">
                      <Button
                        size="icon"
                        className="pointer-events-auto rounded-full shadow-soft"
                        onClick={() => {
                          const node = messagesRef.current;
                          if (node) {
                            node.scrollTo({ top: node.scrollHeight, behavior: "smooth" });
                          }
                        }}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : null}
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
                          if (event.key === "Enter" && !event.shiftKey) {
                            event.preventDefault();
                            void submitMessage();
                          }
                        }}
                      />
                      <Button size="sm" className="w-full px-3 sm:w-auto" disabled={busyAction === "message"} onClick={() => submitMessage()}>
                        <Send className="h-4 w-4" />
                        Отправить
                      </Button>
                    </div>
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
                    {canCreateOffer ? (
                      <>
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
                        <Button disabled={busyAction === "offer"} onClick={submitOffer}>
                          Создать оффер
                        </Button>
                      </>
                    ) : pendingIncomingOffer ? (
                      <>
                        <div className="rounded-lg border bg-muted/50 p-3 text-sm text-muted-foreground">
                          Покупатель прислал оффер. Можно принять его, отклонить или отправить контр-оффер с новой ценой.
                        </div>
                        <Input
                          value={offerAmount}
                          onChange={(event) => setOfferAmount(event.target.value)}
                          inputMode="numeric"
                          placeholder={`${pendingIncomingOffer.amount.amount}`}
                        />
                        <Textarea value={offerMessage} onChange={(event) => setOfferMessage(event.target.value)} placeholder="Например: готов отдать чуть дешевле, если заберете сегодня." />
                        <Button disabled={busyAction === "counter-offer"} onClick={submitCounterOffer}>
                          Отправить контр-оффер
                        </Button>
                      </>
                    ) : hasAnyOffer ? (
                      <p className="rounded-lg border bg-muted/50 p-3 text-sm text-muted-foreground">
                        История офферов ниже. Если нужно обсудить детали, продолжайте переписку в чате.
                      </p>
                    ) : (
                      <p className="rounded-lg border bg-muted/50 p-3 text-sm text-muted-foreground">
                        Здесь появится контр-оффер, когда покупатель предложит свою цену.
                      </p>
                    )}
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
    </>
  );
}

function MessageBubble({
  message,
  currentUserId,
  currentUserName,
  currentUserAvatar,
  counterpartName,
  counterpartAvatar
}: {
  message: Message;
  currentUserId: string;
  currentUserName: string;
  currentUserAvatar?: string;
  counterpartName: string;
  counterpartAvatar?: string;
}) {
  const mine = message.senderId === currentUserId;
  const system = message.type === "system";

  if (system) {
    return <div className="mx-auto max-w-md rounded-lg bg-muted px-3 py-2 text-center text-xs text-muted-foreground">{message.text}</div>;
  }

  const senderName = mine ? currentUserName : counterpartName;
  const senderAvatar = mine ? currentUserAvatar : counterpartAvatar;

  return (
    <div className={mine ? "flex justify-end" : "flex justify-start"}>
      <div className="max-w-[88%]">
        <div className={cn("mb-1 flex items-center gap-2 px-1", mine ? "justify-end" : "justify-start")}>
          <Avatar className="h-6 w-6">
            <AvatarImage src={senderAvatar} />
            <AvatarFallback>{senderName.slice(0, 2)}</AvatarFallback>
          </Avatar>
          <span className="text-xs font-medium text-muted-foreground">{senderName}</span>
        </div>
        <div
          className={cn(
            "break-words rounded-lg px-4 py-3",
            mine ? "bg-primary text-primary-foreground" : "border bg-background"
          )}
        >
          <div className={cn("mb-2 flex items-center", mine ? "justify-end" : "justify-start")}>
            <span className="text-xs opacity-75">{formatRelativeDate(message.createdAt)}</span>
          </div>
          {message.type === "attachment" ? (
            <div className="grid gap-2">
              {message.attachment.type === "image" && message.attachment.url ? (
                <div className="relative h-48 w-full overflow-hidden rounded-lg bg-muted">
                  <Image src={message.attachment.url} alt={message.attachment.alt ?? "Фото"} fill className="object-cover" sizes="(max-width: 768px) 100vw, 40vw" />
                </div>
              ) : null}
              {message.text ? <p className="text-sm leading-6">{message.text}</p> : null}
            </div>
          ) : (
            <p className="text-sm leading-6">{message.text}</p>
          )}
          <div className="mt-1 text-right text-[11px] opacity-70">{message.status}</div>
        </div>
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
  onStatus: (offer: Offer, status: "accepted" | "declined") => Promise<void>;
}) {
  const canModerateOffer =
    (offer.status === "sent" && offer.sellerId === currentUserId) ||
    (offer.status === "countered" && offer.buyerId === currentUserId);

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
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button size="sm" disabled={busyAction === `${offer.id}:accepted`} onClick={() => onStatus(offer, "accepted")}>
            <Check className="h-4 w-4" />
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
