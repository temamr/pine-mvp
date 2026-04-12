import type { ID, ISODate, Money } from "@/lib/domain/common";

export type DealType = "meetup" | "courier" | "pine_check";

export type DealStatus =
  | "created"
  | "payment_pending"
  | "reserved"
  | "handoff_planned"
  | "in_transit"
  | "inspection"
  | "completed"
  | "cancelled";

export type DealTimelineEvent = {
  id: ID;
  label: string;
  description: string;
  createdAt: ISODate;
};

export type Deal = {
  id: ID;
  listingId: ID;
  conversationId: ID;
  buyerId: ID;
  sellerId: ID;
  acceptedOfferId?: ID;
  type: DealType;
  status: DealStatus;
  amount: Money;
  timeline: DealTimelineEvent[];
  createdAt: ISODate;
  updatedAt: ISODate;
};
