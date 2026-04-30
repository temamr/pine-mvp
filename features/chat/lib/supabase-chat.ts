"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Conversation, ID, Listing, Message, Offer } from "@/lib/domain";
import {
  mapConversation,
  mapListing,
  mapMessage,
  mapOffer,
  type SupabaseListingRecord
} from "@/lib/repositories/supabase/mappers";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Database, Json, Tables } from "@/lib/supabase/database.types";

export type ConversationBundle = {
  conversations: Conversation[];
  listingsById: Record<ID, Listing>;
};

export async function loadSupabaseConversations(): Promise<ConversationBundle> {
  const client = createSupabaseBrowserClient();
  const {
    data: { user },
    error: authError
  } = await client.auth.getUser();

  if (authError) {
    throw authError;
  }

  if (!user) {
    return {
      conversations: [],
      listingsById: {}
    };
  }

  const { data: conversations, error } = await client
    .from("conversations")
    .select("*")
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
    .order("last_message_at", { ascending: false });

  if (error) {
    throw error;
  }

  const listingIds = [...new Set(conversations.map((conversation) => conversation.listing_id))];
  const listingsById = await loadListingsById(client, listingIds);

  return {
    conversations: conversations.map(mapConversation),
    listingsById
  };
}

export async function loadSupabaseThread(conversationId: ID) {
  const client = createSupabaseBrowserClient();
  const [{ data: conversation, error: conversationError }, { data: messages, error: messagesError }, { data: offers, error: offersError }] =
    await Promise.all([
      client.from("conversations").select("*").eq("id", conversationId).maybeSingle(),
      client.from("messages").select("*").eq("conversation_id", conversationId).order("created_at", { ascending: true }),
      client.from("offers").select("*").eq("conversation_id", conversationId).order("created_at", { ascending: false })
    ]);

  if (conversationError) {
    throw conversationError;
  }

  if (messagesError) {
    throw messagesError;
  }

  if (offersError) {
    throw offersError;
  }

  const listing = conversation
    ? (await loadListingsById(client, [conversation.listing_id]))[conversation.listing_id] ?? null
    : null;

  return {
    conversation: conversation ? mapConversation(conversation) : null,
    listing,
    messages: messages.map(mapMessage),
    offers: offers.map(mapOffer)
  };
}

export async function startSupabaseConversation(listingId: ID): Promise<ID> {
  const client = createSupabaseBrowserClient();
  const {
    data: { user },
    error: authError
  } = await client.auth.getUser();

  if (authError) {
    throw authError;
  }

  if (!user) {
    throw new Error("Войдите, чтобы начать чат.");
  }

  const { data: listing, error: listingError } = await client
    .from("listings")
    .select("id, seller_id")
    .eq("id", listingId)
    .single();

  if (listingError) {
    throw listingError;
  }

  if (listing.seller_id === user.id) {
    throw new Error("Нельзя начать чат со своим объявлением.");
  }

  const { data: existing, error: existingError } = await client
    .from("conversations")
    .select("*")
    .eq("listing_id", listingId)
    .eq("buyer_id", user.id)
    .eq("seller_id", listing.seller_id)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  if (existing) {
    return existing.id;
  }

  const { data: conversation, error } = await client
    .from("conversations")
    .insert({
      listing_id: listingId,
      buyer_id: user.id,
      seller_id: listing.seller_id
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  await insertSystemMessage(client, conversation.id, "Диалог создан. Объявление закреплено вверху переписки.");

  return conversation.id;
}

export async function sendSupabaseMessage(conversationId: ID, text: string): Promise<Message> {
  const client = createSupabaseBrowserClient();
  const {
    data: { user },
    error: authError
  } = await client.auth.getUser();

  if (authError) {
    throw authError;
  }

  if (!user) {
    throw new Error("Войдите, чтобы отправить сообщение.");
  }

  const { data, error } = await client
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      type: "text",
      text,
      status: "sent"
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  await client
    .from("conversations")
    .update({ last_message_at: new Date().toISOString() })
    .eq("id", conversationId);

  return mapMessage(data);
}

export async function sendSupabaseAttachmentNotice(conversationId: ID, label: string): Promise<Message> {
  const client = createSupabaseBrowserClient();
  const {
    data: { user },
    error: authError
  } = await client.auth.getUser();

  if (authError) {
    throw authError;
  }

  if (!user) {
    throw new Error("Войдите, чтобы отправить вложение.");
  }

  const attachment: Json = {
    type: "image",
    url: "",
    alt: label
  };

  const { data, error } = await client
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      type: "attachment",
      text: `${label} добавлено в переписку.`,
      attachment,
      status: "sent"
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  await client
    .from("conversations")
    .update({ last_message_at: new Date().toISOString() })
    .eq("id", conversationId);

  return mapMessage(data);
}

export async function createSupabaseOffer(conversation: Conversation, amount: number, message?: string): Promise<Offer> {
  const client = createSupabaseBrowserClient();
  const {
    data: { user },
    error: authError
  } = await client.auth.getUser();

  if (authError) {
    throw authError;
  }

  if (!user) {
    throw new Error("Войдите, чтобы отправить оффер.");
  }

  if (user.id !== conversation.buyerId) {
    throw new Error("Оффер может создать только покупатель. Продавец может ответить контр-оффером.");
  }

  const { data, error } = await client
    .from("offers")
    .insert({
      conversation_id: conversation.id,
      listing_id: conversation.listingId,
      buyer_id: conversation.buyerId,
      seller_id: conversation.sellerId,
      amount,
      currency: "USD",
      status: "sent",
      message
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  await insertSystemMessage(client, conversation.id, `Оффер на ${amount} USD отправлен продавцу.`);

  return mapOffer(data);
}

export async function acceptSupabaseOffer(offerId: ID): Promise<Offer> {
  const client = createSupabaseBrowserClient();
  const { data, error } = await client.rpc("accept_offer", { p_offer_id: offerId });

  if (error) {
    throw error;
  }

  return mapOffer(data);
}

export async function declineSupabaseOffer(offerId: ID): Promise<Offer> {
  const client = createSupabaseBrowserClient();
  const { data, error } = await client.rpc("decline_offer", { p_offer_id: offerId });

  if (error) {
    throw error;
  }

  return mapOffer(data);
}

export async function counterSupabaseOffer(offerId: ID, conversationId: ID): Promise<Offer> {
  const client = createSupabaseBrowserClient();
  const { data, error } = await client
    .from("offers")
    .update({ status: "countered" })
    .eq("id", offerId)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  await insertSystemMessage(client, conversationId, "Продавец отправил контр-оффер.");

  return mapOffer(data);
}

export function subscribeToSupabaseThread(
  conversationId: ID,
  handlers: {
    onMessage: (message: Message) => void;
    onOfferChange: (offer: Offer) => void;
  }
) {
  const client = createSupabaseBrowserClient();

  const channel = client
    .channel(`conversation:${conversationId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${conversationId}`
      },
      (payload) => {
        handlers.onMessage(mapMessage(payload.new as Tables<"messages">));
      }
    )
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "offers",
        filter: `conversation_id=eq.${conversationId}`
      },
      (payload) => {
        handlers.onOfferChange(mapOffer(payload.new as Tables<"offers">));
      }
    )
    .subscribe();

  return () => {
    void client.removeChannel(channel);
  };
}

async function loadListingsById(client: SupabaseClient<Database>, listingIds: ID[]) {
  if (!listingIds.length) {
    return {};
  }

  const { data, error } = await client
    .from("listings")
    .select("*, listing_images(*)")
    .in("id", listingIds)
    .returns<SupabaseListingRecord[]>();

  if (error) {
    throw error;
  }

  return Object.fromEntries(data.map((listing) => [listing.id, mapListing(listing)]));
}

async function insertSystemMessage(client: SupabaseClient<Database>, conversationId: ID, text: string) {
  const { error } = await client.from("messages").insert({
    conversation_id: conversationId,
    sender_id: null,
    type: "system",
    text,
    status: "sent"
  });

  if (error) {
    throw error;
  }

  await client
    .from("conversations")
    .update({ last_message_at: new Date().toISOString() })
    .eq("id", conversationId);
}
