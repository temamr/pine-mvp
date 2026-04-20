# Pine Supabase

Stage 3 adds the backend foundation without replacing the Stage 2 frontend state yet.

## Files

- `migrations/202604190001_pine_schema.sql` creates enums, tables, indexes, RLS policies, storage buckets and realtime publication entries.
- `migrations/202604190002_chat_offers.sql` adds Stage 7 offer RPC functions for atomic accept/decline and the system-message policy used by chat events.
- `migrations/202604190003_trust_safety.sql` adds Stage 8 staff helpers, moderation/complaint RPC functions, profile block fields and review/deal count triggers.
- `migrations/202604190004_safe_deals.sql` adds Stage 9 safe deal creation, lifecycle advancement and timeline helpers.
- `migrations/202604190005_notifications_analytics.sql` adds Stage 10 notification triggers, analytics event triggers, listing view tracking and dashboard metrics.
- `seed.sql` inserts the electronics category tree used by the mock catalog.

## Local Flow

```bash
supabase start
supabase db push
supabase db execute --file supabase/seed.sql
```

Generate types from a linked project when credentials are available:

```bash
supabase gen types typescript --project-id <project-id> --schema public > lib/supabase/database.types.ts
```

The checked-in `database.types.ts` is a generated-style baseline so repository adapters can be developed before a real project is linked.

## Chat And Offers

Realtime publication includes `conversations`, `messages` and `offers`. The frontend subscribes per conversation and maps rows through the existing domain mappers.

Offer accept flow runs in `accept_offer(p_offer_id)`:

- validates the current user is the seller;
- locks the selected offer;
- accepts it and declines other sent offers in that conversation;
- changes the listing to `reserved`;
- moves the conversation to `deal_started`;
- inserts a system message and buyer notification.

## Trust And Safety

Stage 8 uses profile roles for staff access:

```sql
update public.profiles
set role = 'admin'
where id = '<your-profile-id>';
```

Available RPC functions:

- `moderate_listing(p_listing_id, p_decision, p_note)` validates moderator/admin role, updates listing status, writes seller feedback, notification and analytics.
- `resolve_complaint(p_complaint_id, p_status)` moves complaints through review statuses and notifies the reporter.
- `verify_profile(p_profile_id, p_status)` updates verification flags for trust staff.
- `block_profile(p_profile_id, p_reason)` marks a profile blocked; this requires admin role.

Review triggers keep `profiles.rating`, `profiles.reviews_count` and `profiles.completed_deals_count` in sync with `reviews` and completed `deals`.

## Safe Deals

Stage 9 uses accepted offers as the source of truth for deal amount:

- `create_safe_deal(p_conversation_id, p_type)` validates the actor is a conversation participant, requires an accepted offer, creates/reuses a deal, reserves the listing and writes system messages.
- `advance_deal(p_deal_id, p_status)` validates participant/staff access, appends a timeline event and updates delivery/check status.
- When a deal reaches `completed`, the listing becomes `sold`, the conversation becomes `completed`, and `deal_completed` analytics is inserted.

Escrow/payment is represented by deal status and timeline only. A real payment provider can later attach to the same state machine.

## Notifications And Analytics

Stage 10 writes in-app notifications from database events:

- message insert → `message`;
- listing price update → `favorite_price_changed`;
- listing sold update → `favorite_sold`;
- offer, moderation and deal functions write their own user-facing notifications.

Analytics events are recorded through triggers/RPC:

- `track_listing_view(p_listing_id, p_session_id)` writes `listing_views`, increments `views_count` and records `listing_viewed`;
- `track_analytics_event(...)` records browser-side events like search and filter usage;
- conversation, offer and favorite triggers write `chat_started`, `offer_sent`, `offer_accepted` and `favorite_added`;
- deal and moderation lifecycle functions record deal and moderation events.

`analytics_dashboard()` returns aggregate metrics and requires moderator/admin role.
