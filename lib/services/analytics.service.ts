import type { AnalyticsEvent, AnalyticsEventName } from "@/lib/domain";

export type TrackEventInput = {
  name: AnalyticsEventName;
  actorId?: string;
  listingId?: string;
  conversationId?: string;
  dealId?: string;
  metadata?: AnalyticsEvent["metadata"];
};

export type AnalyticsService = {
  track(input: TrackEventInput): Promise<void>;
};

export const mockAnalyticsService: AnalyticsService = {
  async track(input) {
    console.info("[analytics:mock]", {
      ...input,
      createdAt: new Date().toISOString()
    });
  }
};
