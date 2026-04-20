import type { SupabaseClient } from "@supabase/supabase-js";
import type { OffersRepository } from "@/lib/repositories";
import { mapOffer } from "@/lib/repositories/supabase/mappers";
import type { Database } from "@/lib/supabase/database.types";

export function createSupabaseOffersRepository(client: SupabaseClient<Database>): OffersRepository {
  return {
    async listByConversation(conversationId) {
      const { data, error } = await client
        .from("offers")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      return data.map(mapOffer);
    },

    async create(input) {
      const { data, error } = await client
        .from("offers")
        .insert({
          conversation_id: input.conversationId,
          listing_id: input.listingId,
          buyer_id: input.buyerId,
          seller_id: input.sellerId,
          amount: input.amount.amount,
          currency: input.amount.currency,
          message: input.message,
          status: "sent"
        })
        .select("*")
        .single();

      if (error) {
        throw error;
      }

      return mapOffer(data);
    }
  };
}
