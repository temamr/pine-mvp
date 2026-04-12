import type { AsyncResult, ID, Offer } from "@/lib/domain";

export type OffersRepository = {
  listByConversation(conversationId: ID): AsyncResult<Offer[]>;
  create(input: Pick<Offer, "conversationId" | "listingId" | "buyerId" | "sellerId" | "amount" | "message">): AsyncResult<Offer>;
};
