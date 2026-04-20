"use client";

import type { AnalyticsEventName, ID } from "@/lib/domain";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Json } from "@/lib/supabase/database.types";

export type AnalyticsDashboardMetrics = {
  completedDealsCount: number;
  startedConversationsCount: number;
  listingViewsCount: number;
  offersCount: number;
  acceptedOffersCount: number;
  viewToChatConversion: number;
  chatToOfferConversion: number;
  offerToDealConversion: number;
  offerAcceptanceRate: number;
  timeToFirstReactionMinutes: number;
  firstPassModerationApprovalRate: number;
};

export async function fetchSupabaseAnalyticsDashboard(): Promise<AnalyticsDashboardMetrics> {
  const client = createSupabaseBrowserClient();
  const { data, error } = await client.rpc("analytics_dashboard");

  if (error) {
    throw error;
  }

  return parseMetrics(data);
}

export async function trackSupabaseListingView(listingId: ID) {
  const client = createSupabaseBrowserClient();
  const sessionId = getAnalyticsSessionId();
  const { error } = await client.rpc("track_listing_view", {
    p_listing_id: listingId,
    p_session_id: sessionId
  });

  if (error) {
    throw error;
  }
}

export async function trackSupabaseAnalyticsEvent(input: {
  name: AnalyticsEventName;
  listingId?: ID;
  conversationId?: ID;
  dealId?: ID;
  metadata?: Record<string, string | number | boolean>;
}) {
  const client = createSupabaseBrowserClient();
  const { error } = await client.rpc("track_analytics_event", {
    p_name: input.name,
    p_listing_id: input.listingId ?? null,
    p_conversation_id: input.conversationId ?? null,
    p_deal_id: input.dealId ?? null,
    p_metadata: input.metadata ?? null
  });

  if (error) {
    throw error;
  }
}

function parseMetrics(value: Json): AnalyticsDashboardMetrics {
  const record = value && typeof value === "object" && !Array.isArray(value) ? value : {};

  return {
    completedDealsCount: numberMetric(record.completedDealsCount),
    startedConversationsCount: numberMetric(record.startedConversationsCount),
    listingViewsCount: numberMetric(record.listingViewsCount),
    offersCount: numberMetric(record.offersCount),
    acceptedOffersCount: numberMetric(record.acceptedOffersCount),
    viewToChatConversion: numberMetric(record.viewToChatConversion),
    chatToOfferConversion: numberMetric(record.chatToOfferConversion),
    offerToDealConversion: numberMetric(record.offerToDealConversion),
    offerAcceptanceRate: numberMetric(record.offerAcceptanceRate),
    timeToFirstReactionMinutes: numberMetric(record.timeToFirstReactionMinutes),
    firstPassModerationApprovalRate: numberMetric(record.firstPassModerationApprovalRate)
  };
}

function numberMetric(value: Json | undefined) {
  return typeof value === "number" ? value : 0;
}

function getAnalyticsSessionId() {
  const key = "pine_analytics_session_id";
  const existing = window.localStorage.getItem(key);

  if (existing) {
    return existing;
  }

  const next = crypto.randomUUID();
  window.localStorage.setItem(key, next);
  return next;
}
