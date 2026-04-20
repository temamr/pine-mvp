# Deals

Safe deal, delivery/check workflow and escrow state abstractions live here.

## Stage 9

- `deals-screen.tsx` remains the mock fallback.
- `supabase-deals-screen.tsx` is used when Supabase env is configured.
- `lib/supabase-deals.ts` owns deal loading, creation, status advancement and Realtime subscription.
- Safe deal creation starts in `SupabaseChatScreen` after an offer is accepted.

Lifecycle:

- `create_safe_deal(...)` creates or reuses a deal from the accepted offer amount.
- `advance_deal(...)` moves the state machine and appends timeline events.
- `completed` marks the listing as `sold`, closes the conversation and feeds analytics/review counters.

Current payment behavior is intentionally a platform state machine. No real payment provider is connected yet.
