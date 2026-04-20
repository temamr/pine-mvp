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
  deals: Deal[];
  listingsById: Record<ID, Listing>;
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
      deals: [],
      listingsById: {}
    };
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

  return {
    userId: user.id,
    deals,
    listingsById
  };
}

export async function createSupabaseSafeDeal(conversationId: ID, type: DealType): Promise<Deal> {
  const client = createSupabaseBrowserClient();
  const { data, error } = await client.rpc("create_safe_deal", {
    p_conversation_id: conversationId,
    p_type: type
  });

  if (error) {
    throw error;
  }

  return mapDeal(data);
}

export async function advanceSupabaseDeal(dealId: ID, status: DealStatus): Promise<Deal> {
  const client = createSupabaseBrowserClient();
  const { data, error } = await client.rpc("advance_deal", {
    p_deal_id: dealId,
    p_status: status
  });

  if (error) {
    throw error;
  }

  return mapDeal(data);
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
