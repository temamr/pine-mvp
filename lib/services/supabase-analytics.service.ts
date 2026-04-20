import type { SupabaseClient } from "@supabase/supabase-js";
import type { AnalyticsService, TrackEventInput } from "@/lib/services/analytics.service";
import type { Database } from "@/lib/supabase/database.types";

export function createSupabaseAnalyticsService(
  client: SupabaseClient<Database>
): AnalyticsService {
  return {
    async track(input: TrackEventInput) {
      const { error } = await client.from("analytics_events").insert({
        name: input.name,
        actor_id: input.actorId,
        listing_id: input.listingId,
        conversation_id: input.conversationId,
        deal_id: input.dealId,
        metadata: input.metadata
      });

      if (error) {
        throw error;
      }
    }
  };
}
