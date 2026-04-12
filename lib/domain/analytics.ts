import type { ID, ISODate } from "@/lib/domain/common";

export type AnalyticsEventName =
  | "listing_viewed"
  | "chat_started"
  | "offer_sent"
  | "offer_accepted"
  | "deal_created"
  | "deal_completed"
  | "moderation_approved"
  | "moderation_rejected"
  | "favorite_added"
  | "search_used"
  | "filters_applied";

export type AnalyticsEvent = {
  id: ID;
  name: AnalyticsEventName;
  actorId?: ID;
  listingId?: ID;
  conversationId?: ID;
  dealId?: ID;
  metadata?: Record<string, string | number | boolean>;
  createdAt: ISODate;
};
