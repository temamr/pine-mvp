"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Camera, Check, HandCoins, ImagePlus, MapPin, MessageSquare, PackageCheck, Send, X } from "lucide-react";
import type { Conversation, DealType, Message, Offer } from "@/lib/domain";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { usePineStore, demoUsers } from "@/lib/mock/use-pine-store";
import { formatMoney, formatRelativeDate } from "@/lib/utils/format";
import { dealTypeLabel, offerStatusLabel } from "@/lib/utils/labels";

const quickReplies = ["Да, доступно", "Могу сегодня после 18:00", "Пришлите еще фото", "Готов оформить через Pine"];
const dealTypes: DealType[] = ["meetup", "courier", "pine_check"];

type ChatScreenProps = {
  initialConversationId?: string;
};

export function ChatScreen({ initialConversationId }: ChatScreenProps) {
  const router = useRouter();
  const { toast } = useToast();
  const currentUserId = usePineStore((state) => state.currentUserId);
  const conversations = usePineStore((state) => state.conversations);
  const listings = usePineStore((state) => state.listings);
  const messages = usePineStore((state) => state.messages);
  const offers = usePineStore((state) => state.offers);
  const sendMessage = usePineStore((state) => state.sendMessage);
  const sendAttachmentNotice = usePineStore((state) => state.sendAttachmentNotice);
  const createOffer = usePineStore((state) => state.createOffer);
  const updateOfferStatus = usePineStore((state) => state.updateOfferStatus);
  const startDeal = usePineStore((state) => state.startDeal);
  const [selectedId, setSelectedId] = React.useState(initialConversationId ?? conversations[0]?.id ?? "");
  const [messageText, setMessageText] = React.useState("");
  const [offerAmount, setOfferAmount] = React.useState("");
  const [offerMessage, setOfferMessage] = React.useState("Могу забрать сегодня.");
  const selected = conversations.find((conversation) => conversation.id === selectedId) ?? conversations[0];
  const listing = selected ? listings.find((item) => item.id === selected.listingId) : null;
  const threadMessages = selected ? messages.filter((message) => message.conversationId === selected.id) : [];
  const threadOffers = selected ? offers.filter((offer) => offer.conversationId === selected.id) : [];
  const seller = listing ? demoUsers.find((user) => user.id === listing.sellerId) : null;
  const lowball = listing ? Number(offerAmount) > 0 && Number(offerAmount) < listing.price.amount * 0.75 : false;

  React.useEffect(() => {
    if (initialConversationId) {
      setSelectedId(initialConversationId);
    }
  }, [initialConversationId]);

  function selectConversation(conversation: Conversation) {
    setSelectedId(conversation.id);
    router.replace(`/chat/${conversation.id}`);
  }

  function submitMessage(text = messageText) {
    if (!selected || !text.trim()) return;
    sendMessage(selected.id, text);
    setMessageText("");
  }

  function submitOffer() {
    if (!selected) return;
    const offer = createOffer(selected.id, Number(offerAmount), offerMessage);
    if (offer) {
      toast({ title: "Оффер отправлен", description: "Он появился в ленте диалога." });
      setOfferAmount("");
    }
  }

  function chooseDeal(type: DealType) {
    if (!selected) return;
    const deal = startDeal(selected.id, type);
    if (deal) {
      toast({ title: "Safe deal создана", description: `${dealTypeLabel[type]} добавлена в сделки.` });
      router.push("/deals");
    }
  }

  return (
    <div className="grid min-w-0 gap-4 lg:h-[calc(100dvh-7rem)] lg:grid-cols-[15rem_minmax(0,1fr)] xl:grid-cols-[16rem_minmax(0,1fr)]">
      <Card className="min-w-0 overflow-hidden bg-white/92 lg:h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Диалоги
          </CardTitle>
        </CardHeader>
        <CardContent className="flex gap-3 overflow-x-auto p-4 pt-0 lg:grid lg:max-h-[calc(100%-5rem)] lg:overflow-y-auto lg:overflow-x-hidden">
          {conversations.map((conversation) => {
            const itemListing = listings.find((item) => item.id === conversation.listingId);
            return (
              <button
                key={conversation.id}
                className={
                  conversation.id === selected?.id
                    ? "w-64 shrink-0 rounded-lg border-2 border-primary bg-primary/10 p-3 text-left lg:w-auto"
                    : "w-64 shrink-0 rounded-lg border bg-background p-3 text-left hover:bg-white lg:w-auto"
                }
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
            <Card className="min-w-0 overflow-hidden bg-white/94">
              <CardContent className="grid gap-4 p-4 md:grid-cols-[auto_1fr_auto] md:items-center">
                <div className="relative h-20 w-20 overflow-hidden rounded-lg bg-muted">
                  {listing.images[0] ? (
                    <Image src={listing.images[0].url} alt={listing.images[0].alt} fill className="object-cover" sizes="80px" />
                  ) : null}
                </div>
                <div className="min-w-0">
                  <Link href={`/listings/${listing.id}`} className="line-clamp-1 font-semibold hover:text-primary">{listing.title}</Link>
                  <p className="mt-1 text-sm text-muted-foreground">{seller?.displayName} · {formatMoney(listing.price)}</p>
                </div>
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="secondary">
                      <PackageCheck className="h-4 w-4" />
                      Оформить сделку
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right">
                    <SheetHeader>
                      <SheetTitle>Safe deal</SheetTitle>
                    </SheetHeader>
                    <div className="mt-6 grid gap-3">
                      {dealTypes.map((type) => (
                        <button key={type} className="rounded-lg border bg-background p-4 text-left hover:bg-white" onClick={() => chooseDeal(type)}>
                          <p className="font-semibold">{dealTypeLabel[type]}</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {type === "meetup" ? "Встреча с подтверждением завершения." : type === "courier" ? "Курьерский сценарий с трекингом." : "Проверка состояния через Pine."}
                          </p>
                        </button>
                      ))}
                    </div>
                  </SheetContent>
                </Sheet>
              </CardContent>
            </Card>

            <div className="grid min-h-0 min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_15rem] 2xl:grid-cols-[minmax(0,1fr)_16rem]">
              <Card className="flex h-[calc(100dvh-19rem)] min-h-[31rem] min-w-0 flex-col overflow-hidden bg-white/92 lg:h-full lg:min-h-0">
                <CardContent className="flex min-h-0 flex-1 flex-col p-0">
                  <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
                    {threadMessages.map((message) => (
                      <MessageBubble key={message.id} message={message} currentUserId={currentUserId} />
                    ))}
                  </div>
                  <div className="shrink-0 border-t p-3 sm:p-4">
                    <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
                      {quickReplies.map((reply) => (
                        <Button key={reply} className="shrink-0" variant="outline" size="sm" onClick={() => submitMessage(reply)}>
                          {reply}
                        </Button>
                      ))}
                    </div>
                    <div className="grid min-w-0 gap-2 sm:grid-cols-[auto_auto_minmax(0,1fr)_auto]">
                      <Button variant="outline" size="icon" aria-label="Фото" onClick={() => sendAttachmentNotice(selected.id, "Фото")}>
                        <ImagePlus className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" aria-label="Геолокация" onClick={() => sendAttachmentNotice(selected.id, "Геолокация")}>
                        <MapPin className="h-4 w-4" />
                      </Button>
                      <Input value={messageText} onChange={(event) => setMessageText(event.target.value)} placeholder="Напишите сообщение" onKeyDown={(event) => {
                        if (event.key === "Enter") submitMessage();
                      }} />
                      <Button className="w-full sm:w-auto" onClick={() => submitMessage()}>
                        <Send className="h-4 w-4" />
                        Отправить
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <aside className="min-w-0 overflow-hidden xl:h-full xl:overflow-y-auto">
                <Card className="bg-white/94">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <HandCoins className="h-5 w-5 text-primary" />
                      Офферы
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-3">
                    <Input value={offerAmount} onChange={(event) => setOfferAmount(event.target.value)} inputMode="numeric" placeholder={`${listing.price.amount - 80}`} />
                    {lowball ? (
                      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-900">
                        Это lowball-оффер. Добавьте контекст, чтобы не потерять ответ.
                      </div>
                    ) : null}
                    <Textarea value={offerMessage} onChange={(event) => setOfferMessage(event.target.value)} />
                    <Button onClick={submitOffer}>Создать оффер</Button>
                    <div className="grid gap-2">
                      {threadOffers.map((offer) => (
                        <OfferRow key={offer.id} offer={offer} onStatus={updateOfferStatus} />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </aside>
            </div>
          </>
        ) : (
          <Card className="bg-white/92">
            <CardContent className="p-8 text-center text-muted-foreground">Начните диалог из карточки товара.</CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}

function MessageBubble({ message, currentUserId }: { message: Message; currentUserId: string }) {
  const mine = message.senderId === currentUserId;
  const system = message.type === "system";
  const user = typeof message.senderId === "string" ? demoUsers.find((item) => item.id === message.senderId) : null;

  if (system) {
    return <div className="mx-auto max-w-md rounded-lg bg-muted px-3 py-2 text-center text-xs text-muted-foreground">{message.text}</div>;
  }

  return (
    <div className={mine ? "flex justify-end" : "flex justify-start"}>
      <div
        className={
          mine
            ? "max-w-[88%] break-words rounded-lg bg-primary px-4 py-3 text-primary-foreground"
            : "max-w-[88%] break-words rounded-lg border bg-white px-4 py-3"
        }
      >
        <div className="mb-2 flex items-center gap-2">
          {!mine ? (
            <Avatar className="h-6 w-6">
              <AvatarImage src={user?.avatarUrl} />
              <AvatarFallback>{user?.displayName.slice(0, 2) ?? "P"}</AvatarFallback>
            </Avatar>
          ) : null}
          <span className="text-xs opacity-75">{formatRelativeDate(message.createdAt)}</span>
        </div>
        {message.type === "attachment" ? (
          <div className="flex items-center gap-2">
            <Camera className="h-4 w-4" />
            <span>{message.text ?? "Вложение"}</span>
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
  onStatus
}: {
  offer: Offer;
  onStatus: (offerId: string, status: "accepted" | "declined" | "countered" | "expired") => void;
}) {
  return (
    <div className="rounded-lg border bg-background p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="font-semibold">{formatMoney(offer.amount)}</p>
        <Badge variant={offer.status === "accepted" ? "success" : offer.status === "declined" ? "danger" : "accent"}>
          {offerStatusLabel[offer.status]}
        </Badge>
      </div>
      {offer.message ? <p className="mt-2 text-sm text-muted-foreground">{offer.message}</p> : null}
      {offer.status === "sent" ? (
        <div className="mt-3 grid grid-cols-3 gap-2">
          <Button size="sm" onClick={() => onStatus(offer.id, "accepted")}>
            <Check className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={() => onStatus(offer.id, "countered")}>
            ↔
          </Button>
          <Button size="sm" variant="destructive" onClick={() => onStatus(offer.id, "declined")}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : null}
    </div>
  );
}
