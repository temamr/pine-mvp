"use client";

import { create } from "zustand";
import type {
  Complaint,
  Conversation,
  Deal,
  DealStatus,
  DealType,
  Favorite,
  ID,
  Listing,
  ListingCondition,
  Message,
  ModerationCase,
  Notification,
  Offer,
  OfferStatus
} from "@/lib/domain";
import {
  mockComplaints,
  mockConversations,
  mockDeals,
  mockFavorites,
  mockListings,
  mockMessages,
  mockModerationCases,
  mockNotifications,
  mockOffers,
  mockUsers
} from "@/lib/mock/fixtures";

type ListingDraftPayload = {
  title: string;
  description: string;
  price: number;
  categoryId: ID;
  condition: ListingCondition;
  locationLabel: string;
  imageUrls: string[];
  submitToModeration: boolean;
};

type ComplaintPayload = {
  targetType: Complaint["targetType"];
  targetId: ID;
  reason: Complaint["reason"];
  details: string;
};

type StoreState = {
  currentUserId: ID;
  listings: Listing[];
  conversations: Conversation[];
  messages: Message[];
  offers: Offer[];
  favorites: Favorite[];
  deals: Deal[];
  moderationCases: ModerationCase[];
  complaints: Complaint[];
  notifications: Notification[];
  toggleFavorite: (listingId: ID) => void;
  archiveFavorite: (listingId: ID) => void;
  startConversation: (listingId: ID) => ID;
  sendMessage: (conversationId: ID, text: string) => void;
  sendAttachmentNotice: (conversationId: ID, label: string) => void;
  createOffer: (conversationId: ID, amount: number, message?: string) => Offer | null;
  updateOfferStatus: (offerId: ID, status: Exclude<OfferStatus, "draft" | "sent">) => void;
  createListing: (payload: ListingDraftPayload) => Listing;
  markListingSold: (listingId: ID) => void;
  resubmitListing: (listingId: ID) => void;
  moderateListing: (
    listingId: ID,
    decision: "approved" | "needs_changes" | "rejected",
    note?: string
  ) => void;
  createComplaint: (payload: ComplaintPayload) => Complaint;
  markNotificationRead: (notificationId: ID) => void;
  markAllNotificationsRead: () => void;
  startDeal: (conversationId: ID, type: DealType) => Deal | null;
  advanceDeal: (dealId: ID, status: DealStatus) => void;
};

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}_${Date.now()}`;
}

function now() {
  return new Date().toISOString();
}

function systemMessage(conversationId: ID, text: string): Message {
  return {
    id: uid("message_system"),
    conversationId,
    senderId: "system",
    type: "system",
    text,
    status: "sent",
    createdAt: now()
  };
}

export const usePineStore = create<StoreState>((set, get) => ({
  currentUserId: "user_buyer_eli",
  listings: mockListings,
  conversations: mockConversations,
  messages: mockMessages,
  offers: mockOffers,
  favorites: mockFavorites,
  deals: mockDeals,
  moderationCases: mockModerationCases,
  complaints: mockComplaints,
  notifications: mockNotifications,

  toggleFavorite(listingId) {
    const { favorites, currentUserId } = get();
    const existing = favorites.find(
      (favorite) => favorite.userId === currentUserId && favorite.listingId === listingId && !favorite.archivedAt
    );

    if (existing) {
      set({
        favorites: favorites.filter((favorite) => favorite.id !== existing.id),
        listings: get().listings.map((listing) =>
          listing.id === listingId ? { ...listing, isFavorite: false } : listing
        )
      });
      return;
    }

    const favorite: Favorite = {
      id: uid("favorite"),
      userId: currentUserId,
      listingId,
      createdAt: now()
    };

    set({
      favorites: [...favorites, favorite],
      listings: get().listings.map((listing) =>
        listing.id === listingId ? { ...listing, isFavorite: true } : listing
      ),
      notifications: [
        {
          id: uid("notification"),
          userId: currentUserId,
          type: "favorite_price_changed",
          title: "Добавлено в избранное",
          body: "Pine сообщит, если цена изменится или товар продадут.",
          href: `/listings/${listingId}`,
          createdAt: now()
        },
        ...get().notifications
      ]
    });
  },

  archiveFavorite(listingId) {
    set({
      favorites: get().favorites.map((favorite) =>
        favorite.listingId === listingId ? { ...favorite, archivedAt: favorite.archivedAt ?? now() } : favorite
      )
    });
  },

  startConversation(listingId) {
    const { conversations, currentUserId, listings } = get();
    const listing = listings.find((item) => item.id === listingId);

    if (!listing) {
      return "";
    }

    const existing = conversations.find(
      (conversation) =>
        conversation.listingId === listingId &&
        conversation.buyerId === currentUserId &&
        conversation.sellerId === listing.sellerId
    );

    if (existing) {
      return existing.id;
    }

    const conversation: Conversation = {
      id: uid("conversation"),
      listingId,
      buyerId: currentUserId,
      sellerId: listing.sellerId,
      status: "active",
      unreadCount: 0,
      lastMessageAt: now(),
      createdAt: now()
    };

    set({
      conversations: [conversation, ...conversations],
      messages: [
        ...get().messages,
        systemMessage(conversation.id, "Диалог создан. Объявление закреплено вверху переписки.")
      ],
      notifications: [
        {
          id: uid("notification"),
          userId: currentUserId,
          type: "message",
          title: "Диалог начат",
          body: `Вы написали по объявлению «${listing.title}».`,
          href: `/chat/${conversation.id}`,
          createdAt: now()
        },
        ...get().notifications
      ]
    });

    return conversation.id;
  },

  sendMessage(conversationId, text) {
    if (!text.trim()) {
      return;
    }

    const message: Message = {
      id: uid("message"),
      conversationId,
      senderId: get().currentUserId,
      type: "text",
      text: text.trim(),
      status: "sent",
      createdAt: now()
    };

    set({
      messages: [...get().messages, message],
      conversations: get().conversations.map((conversation) =>
        conversation.id === conversationId ? { ...conversation, lastMessageAt: message.createdAt } : conversation
      )
    });
  },

  sendAttachmentNotice(conversationId, label) {
    set({
      messages: [...get().messages, systemMessage(conversationId, `${label} добавлено как mock-вложение.`)]
    });
  },

  createOffer(conversationId, amount, message) {
    const conversation = get().conversations.find((item) => item.id === conversationId);
    const listing = conversation ? get().listings.find((item) => item.id === conversation.listingId) : null;

    if (!conversation || !listing || amount <= 0) {
      return null;
    }

    const offer: Offer = {
      id: uid("offer"),
      conversationId,
      listingId: listing.id,
      buyerId: conversation.buyerId,
      sellerId: conversation.sellerId,
      amount: { amount, currency: listing.price.currency },
      status: "sent",
      message,
      expiresAt: new Date(Date.now() + 36 * 60 * 60 * 1000).toISOString(),
      createdAt: now(),
      updatedAt: now()
    };

    set({
      offers: [offer, ...get().offers],
      messages: [
        ...get().messages,
        systemMessage(conversationId, `Оффер на ${amount} ${listing.price.currency} отправлен продавцу.`)
      ]
    });

    return offer;
  },

  updateOfferStatus(offerId, status) {
    const offer = get().offers.find((item) => item.id === offerId);
    if (!offer) {
      return;
    }

    const messages = [...get().messages];
    messages.push(systemMessage(offer.conversationId, status === "accepted" ? "Оффер принят. Товар ушел в резерв." : status === "countered" ? "Продавец отправил контр-оффер." : "Оффер отклонен."));

    set({
      offers: get().offers.map((item) =>
        item.id === offerId ? { ...item, status, updatedAt: now() } : item
      ),
      listings:
        status === "accepted"
          ? get().listings.map((listing) =>
              listing.id === offer.listingId ? { ...listing, status: "reserved", updatedAt: now() } : listing
            )
          : get().listings,
      messages
    });
  },

  createListing(payload) {
    const imageUrls = payload.imageUrls.length
      ? payload.imageUrls
      : ["https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80"];
    const listing: Listing = {
      id: uid("listing"),
      sellerId: get().currentUserId,
      categoryId: payload.categoryId,
      title: payload.title,
      description: payload.description,
      price: { amount: payload.price, currency: "USD" },
      condition: payload.condition,
      status: payload.submitToModeration ? "pending" : "draft",
      images: imageUrls.map((url, index) => ({
        id: uid("image"),
        url,
        alt: payload.title,
        position: index
      })),
      attributes: [
        { label: "Источник", value: "Создано в mock wizard" },
        { label: "Готовность", value: payload.submitToModeration ? "На модерации" : "Черновик" }
      ],
      location: {
        city: payload.locationLabel,
        region: "CA",
        country: "US",
        label: payload.locationLabel
      },
      viewsCount: 0,
      createdAt: now(),
      updatedAt: now()
    };

    const moderationCase: ModerationCase = {
      id: uid("moderation"),
      listingId: listing.id,
      status: payload.submitToModeration ? "open" : "needs_changes",
      note: payload.submitToModeration
        ? "Объявление ожидает первой проверки."
        : "Черновик сохранен локально.",
      createdAt: now(),
      updatedAt: now()
    };

    set({
      listings: [listing, ...get().listings],
      moderationCases: [moderationCase, ...get().moderationCases],
      notifications: [
        {
          id: uid("notification"),
          userId: get().currentUserId,
          type: "moderation",
          title: payload.submitToModeration ? "Объявление отправлено" : "Черновик сохранен",
          body: payload.submitToModeration
            ? "Модерация проверит фото и описание."
            : "Можно вернуться и отправить объявление позже.",
          href: `/listings/${listing.id}`,
          createdAt: now()
        },
        ...get().notifications
      ]
    });

    return listing;
  },

  markListingSold(listingId) {
    set({
      listings: get().listings.map((listing) =>
        listing.id === listingId ? { ...listing, status: "sold", updatedAt: now() } : listing
      )
    });
  },

  resubmitListing(listingId) {
    const existingCase = get().moderationCases.find((item) => item.listingId === listingId);
    const moderationCase: ModerationCase = existingCase ?? {
      id: uid("moderation"),
      listingId,
      status: "open",
      createdAt: now(),
      updatedAt: now()
    };

    set({
      listings: get().listings.map((listing) =>
        listing.id === listingId ? { ...listing, status: "pending", updatedAt: now() } : listing
      ),
      moderationCases: existingCase
        ? get().moderationCases.map((item) =>
            item.listingId === listingId
              ? { ...item, status: "open", note: "Повторная отправка на модерацию.", updatedAt: now() }
              : item
          )
        : [
            {
              ...moderationCase,
              status: "open",
              note: "Повторная отправка на модерацию.",
              updatedAt: now()
            },
            ...get().moderationCases
          ]
    });
  },

  moderateListing(listingId, decision, note) {
    const nextListingStatus: Listing["status"] =
      decision === "approved" ? "published" : decision === "needs_changes" ? "needs_changes" : "rejected";
    const listing = get().listings.find((item) => item.id === listingId);
    const existingCase = get().moderationCases.find((item) => item.listingId === listingId);
    const message =
      decision === "approved"
        ? "Объявление опубликовано в каталоге."
        : decision === "needs_changes"
          ? "Продавец увидит комментарий и сможет отправить повторно."
          : "Объявление отклонено и скрыто из публикации.";

    if (!listing) {
      return;
    }

    const updatedCase: ModerationCase = {
      id: existingCase?.id ?? uid("moderation"),
      listingId,
      status: decision,
      moderatorId: "user_admin_mock",
      note: note?.trim() || message,
      createdAt: existingCase?.createdAt ?? now(),
      updatedAt: now()
    };

    set({
      listings: get().listings.map((item) =>
        item.id === listingId
          ? { ...item, status: nextListingStatus, moderationNote: updatedCase.note, updatedAt: now() }
          : item
      ),
      moderationCases: existingCase
        ? decision === "approved" || decision === "rejected"
          ? get().moderationCases.filter((item) => item.id !== existingCase.id)
          : get().moderationCases.map((item) => (item.id === existingCase.id ? updatedCase : item))
        : decision === "approved" || decision === "rejected"
          ? get().moderationCases
          : [updatedCase, ...get().moderationCases],
      notifications: [
        {
          id: uid("notification"),
          userId: listing.sellerId,
          type: "moderation",
          title: decision === "approved" ? "Объявление опубликовано" : "Результат модерации",
          body: `${listing.title}: ${updatedCase.note}`,
          href: `/listings/${listing.id}`,
          createdAt: now()
        },
        ...get().notifications
      ]
    });
  },

  createComplaint(payload) {
    const complaint: Complaint = {
      id: uid("complaint"),
      targetType: payload.targetType,
      targetId: payload.targetId,
      reporterId: get().currentUserId,
      reason: payload.reason,
      details: payload.details,
      status: "submitted",
      createdAt: now(),
      updatedAt: now()
    };

    set({
      complaints: [complaint, ...get().complaints],
      notifications: [
        {
          id: uid("notification"),
          userId: get().currentUserId,
          type: "moderation",
          title: "Жалоба отправлена",
          body: "Trust & Safety проверит обращение и обновит статус.",
          href: "/moderation",
          createdAt: now()
        },
        ...get().notifications
      ]
    });

    return complaint;
  },

  markNotificationRead(notificationId) {
    set({
      notifications: get().notifications.map((notification) =>
        notification.id === notificationId ? { ...notification, readAt: notification.readAt ?? now() } : notification
      )
    });
  },

  markAllNotificationsRead() {
    set({
      notifications: get().notifications.map((notification) => ({
        ...notification,
        readAt: notification.readAt ?? now()
      }))
    });
  },

  startDeal(conversationId, type) {
    const conversation = get().conversations.find((item) => item.id === conversationId);
    const acceptedOffer = get().offers.find(
      (offer) => offer.conversationId === conversationId && offer.status === "accepted"
    );
    const listing = conversation ? get().listings.find((item) => item.id === conversation.listingId) : null;

    if (!conversation || !listing) {
      return null;
    }

    const deal: Deal = {
      id: uid("deal"),
      listingId: listing.id,
      conversationId,
      buyerId: conversation.buyerId,
      sellerId: conversation.sellerId,
      acceptedOfferId: acceptedOffer?.id,
      type,
      status: type === "pine_check" ? "inspection" : "created",
      amount: acceptedOffer?.amount ?? listing.price,
      timeline: [
        {
          id: uid("deal_event"),
          label: "Сделка создана",
          description: type === "pine_check" ? "Pine Check забронировал проверку." : "Участники выбрали формат сделки.",
          createdAt: now()
        }
      ],
      createdAt: now(),
      updatedAt: now()
    };

    set({
      deals: [deal, ...get().deals],
      conversations: get().conversations.map((item) =>
        item.id === conversationId ? { ...item, status: "deal_started", lastMessageAt: now() } : item
      ),
      messages: [...get().messages, systemMessage(conversationId, "Безопасная сделка создана.")]
    });

    return deal;
  },

  advanceDeal(dealId, status) {
    set({
      deals: get().deals.map((deal) =>
        deal.id === dealId
          ? {
              ...deal,
              status,
              updatedAt: now(),
              timeline: [
                ...deal.timeline,
                {
                  id: uid("deal_event"),
                  label: "Статус обновлен",
                  description: `Новый статус: ${status}.`,
                  createdAt: now()
                }
              ]
            }
          : deal
      )
    });
  }
}));

export const demoUsers = mockUsers;
