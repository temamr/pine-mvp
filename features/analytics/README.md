# Analytics

Typed analytics events and metric-facing UI live here.

## Stage 10

- `analytics-screen.tsx` remains the mock fallback.
- `supabase-analytics-screen.tsx` is used when Supabase env is configured.
- `lib/supabase-analytics.ts` owns browser-side event tracking and dashboard fetching.
- `analytics_dashboard()` is restricted to moderator/admin users through `is_trust_staff`.

Tracked events:

- `listing_viewed` from listing detail.
- `search_used` and `filters_applied` from catalog interactions.
- `chat_started`, `offer_sent`, `offer_accepted`, `favorite_added` from database triggers.
- `deal_created`, `deal_completed`, `moderation_approved`, `moderation_rejected` from backend lifecycle functions.

Dashboard metrics include completed deals, started conversations, view/chat/offer/deal funnel conversion, offer acceptance rate, time to first reaction and first-pass moderation approval rate.
