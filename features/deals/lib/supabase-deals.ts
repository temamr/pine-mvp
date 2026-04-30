"use client";

import type { Deal, DealStatus, DealType, ID, Listing } from "@/lib/domain";
import {
  mapDeal,
  mapListing,
  type SupabaseListingRecord
} from "@/lib/repositories/supabase/mappers";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/database.types";

export type SupabaseDealsData = {
  userId: ID | null;
  role: Tables<"profiles">["role"] | null;
  isStaff: boolean;
  deals: Deal[];
  listingsById: Record<ID, Listing>;
  reviewableDealIds: ID[];
};

export async function fetchSupabaseDealsData(): Promise<SupabaseDealsData> {
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
      userId: null,
      role: null,
      isStaff: false,
      deals: [],
      listingsById: {},
      reviewableDealIds: []
    };
  }

  const { data: profile, error: profileError } = await client
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    throw profileError;
  }

  const { data, error } = await client
    .from("deals")
    .select("*")
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
    .order("updated_at", { ascending: false });

  if (error) {
    throw error;
  }

  const deals = data.map(mapDeal);
  const listingsById = await loadListingsById([...new Set(deals.map((deal) => deal.listingId))]);
  const { data: reviews, error: reviewsError } = await client.from("reviews").select("deal_id, recipient_id").eq("author_id", user.id);

  if (reviewsError) {
    throw reviewsError;
  }

  const reviewedKeys = new Set(reviews.map((item) => `${item.deal_id}:${item.recipient_id}`));
  const reviewableDealIds = deals
    .filter((deal) => {
      const recipientId = deal.buyerId === user.id ? deal.sellerId : deal.buyerId;
      return deal.status === "completed" && deal.buyerId !== deal.sellerId && recipientId !== user.id && !reviewedKeys.has(`${deal.id}:${recipientId}`);
    })
    .map((deal) => deal.id);

  return {
    userId: user.id,
    role: profile?.role ?? null,
    isStaff: profile?.role === "admin" || profile?.role === "moderator",
    deals,
    listingsById,
    reviewableDealIds
  };
}

export function subscribeToSupabaseDeals(userId: ID, onChange: (deal: Deal) => void) {
  const client = createSupabaseBrowserClient();
  const channel = client
    .channel(`deals:${userId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "deals"
      },
      (payload) => {
        const deal = mapDeal(payload.new as Tables<"deals">);
        if (deal.buyerId === userId || deal.sellerId === userId) {
          onChange(deal);
        }
      }
    )
    .subscribe();

  return () => {
    void client.removeChannel(channel);
  };
}

async function loadListingsById(listingIds: ID[]) {
  if (!listingIds.length) {
    return {};
  }

  const client = createSupabaseBrowserClient();
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
