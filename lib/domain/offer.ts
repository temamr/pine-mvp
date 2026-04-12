import type { ID, ISODate, Money } from "@/lib/domain/common";

export type OfferStatus = "draft" | "sent" | "accepted" | "declined" | "countered" | "expired";

export type Offer = {
  id: ID;
  conversationId: ID;
  listingId: ID;
  buyerId: ID;
  sellerId: ID;
  amount: Money;
  status: OfferStatus;
  message?: string;
  expiresAt?: ISODate;
  createdAt: ISODate;
  updatedAt: ISODate;
};
