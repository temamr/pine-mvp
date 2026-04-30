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

export type SupabasePublicProfileData = {
  profile: Tables<"profiles"> | null;
  reviews: Review[];
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
  const reviewableDeals = deals
    .map((deal) => {
      const recipientId = deal.buyer_id === userId ? deal.seller_id : deal.buyer_id;

      return {
        ...deal,
        recipient_id: recipientId,
        has_review: authoredKeys.has(`${deal.id}:${recipientId}`)
      };
    })
    .filter((deal) => deal.recipient_id !== userId && deal.buyer_id !== deal.seller_id);

  return {
    reviews: reviews.map(mapReview),
    reviewableDeals
  };
}

export async function fetchSupabasePublicProfileData(userId: ID): Promise<SupabasePublicProfileData> {
  const client = createSupabaseBrowserClient();
  const [{ data: profile, error: profileError }, { data: reviews, error: reviewsError }] = await Promise.all([
    client.from("profiles").select("*").eq("id", userId).maybeSingle(),
    client.from("reviews").select("*").eq("recipient_id", userId).order("created_at", { ascending: false }).limit(8)
  ]);

  if (profileError) {
    throw profileError;
  }

  if (reviewsError) {
    throw reviewsError;
  }

  return {
    profile: profile ?? null,
    reviews: reviews.map(mapReview)
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

  if (input.recipientId === user.id) {
    throw new Error("Нельзя оставить отзыв самому себе.");
  }

  const { data: deal, error: dealError } = await client
    .from("deals")
    .select("*")
    .eq("id", input.dealId)
    .single();

  if (dealError) {
    throw dealError;
  }

  if (deal.status !== "completed") {
    throw new Error("Отзыв можно оставить только после завершенной сделки.");
  }

  if (deal.buyer_id !== user.id && deal.seller_id !== user.id) {
    throw new Error("Вы не участвуете в этой сделке.");
  }

  if (deal.buyer_id === deal.seller_id) {
    throw new Error("Нельзя оставить отзыв самому себе.");
  }

  const expectedRecipientId = deal.buyer_id === user.id ? deal.seller_id : deal.buyer_id;

  if (expectedRecipientId !== input.recipientId) {
    throw new Error("Отзыв можно оставить только второй стороне сделки.");
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
