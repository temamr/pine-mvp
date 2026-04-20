import type { SupabaseClient } from "@supabase/supabase-js";
import type { ChatRepository } from "@/lib/repositories";
import { mapConversation, mapMessage } from "@/lib/repositories/supabase/mappers";
import type { Database } from "@/lib/supabase/database.types";

export function createSupabaseChatRepository(client: SupabaseClient<Database>): ChatRepository {
  return {
    async listConversations(userId) {
      const { data, error } = await client
        .from("conversations")
        .select("*")
        .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
        .order("last_message_at", { ascending: false });

      if (error) {
        throw error;
      }

      return data.map(mapConversation);
    },

    async byId(conversationId) {
      const { data, error } = await client
        .from("conversations")
        .select("*")
        .eq("id", conversationId)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data ? mapConversation(data) : null;
    },

    async messages(conversationId) {
      const { data, error } = await client
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) {
        throw error;
      }

      return data.map(mapMessage);
    }
  };
}
