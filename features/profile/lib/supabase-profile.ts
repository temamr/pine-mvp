"use client";

import type { ID, Review } from "@/lib/domain";
import { mapReview } from "@/lib/repositories/supabase/mappers";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/database.types";

export type ReviewableDeal = Tables<"deals"> & {
  has_review: boolean;
  recipient_id: ID;
};

export type SupabaseProfileTrustData = {
  reviews: Review[];
  reviewableDeals: ReviewableDeal[];
};

export async function fetchSupabaseProfileTrustData(userId: ID): Promise<SupabaseProfileTrustData> {
  const client = createSupabaseBrowserClient();
  const [{ data: reviews, error: reviewsError }, { data: deals, error: dealsError }, { data: authored, error: authoredError }] =
    await Promise.all([
      client.from("reviews").select("*").eq("recipient_id", userId).order("created_at", { ascending: false }),
      client
        .from("deals")
        .select("*")
        .eq("status", "completed")
        .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
        .order("updated_at", { ascending: false }),
      client.from("reviews").select("deal_id, recipient_id").eq("author_id", userId)
    ]);

  if (reviewsError) {
    throw reviewsError;
  }

  if (dealsError) {
    throw dealsError;
  }

  if (authoredError) {
    throw authoredError;
  }

  const authoredKeys = new Set(authored.map((item) => `${item.deal_id}:${item.recipient_id}`));
  const reviewableDeals = deals.map((deal) => {
    const recipientId = deal.buyer_id === userId ? deal.seller_id : deal.buyer_id;

    return {
      ...deal,
      recipient_id: recipientId,
      has_review: authoredKeys.has(`${deal.id}:${recipientId}`)
    };
  });

  return {
    reviews: reviews.map(mapReview),
    reviewableDeals
  };
}

export async function createSupabaseReview(input: {
  dealId: ID;
  recipientId: ID;
  rating: Review["rating"];
  text: string;
}): Promise<Review> {
  const client = createSupabaseBrowserClient();
  const {
    data: { user },
    error: authError
  } = await client.auth.getUser();

  if (authError) {
    throw authError;
  }

  if (!user) {
    throw new Error("Войдите, чтобы оставить отзыв.");
  }

  const { data, error } = await client
    .from("reviews")
    .insert({
      deal_id: input.dealId,
      author_id: user.id,
      recipient_id: input.recipientId,
      rating: input.rating,
      text: input.text
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return mapReview(data);
}
