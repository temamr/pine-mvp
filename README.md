# Pine Marketplace

Pine is a mobile-first marketplace MVP where users discover listings, chat with sellers and close the deal inside the conversation.

## Stage 1 Scope

The project foundation contains:

- Next.js App Router with TypeScript strict mode.
- Tailwind CSS theme tokens and a shadcn-style UI kit.
- App shell with responsive header, desktop sidebar and mobile bottom nav.
- Domain models for users, listings, categories, conversations, messages, offers, favorites, deals, moderation, complaints, reviews, notifications and analytics events.
- Mock fixtures and async repositories shaped like future backend adapters.
- Route skeleton for the core product areas.

## Run Locally

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## Stage 2 Scope

The current app is a clickable frontend on mock data:

- Catalog with search, categories, filters, sorting, quick preview, recently viewed and recommendations.
- Listing detail with gallery, seller card, location placeholder, favorite, chat CTA, offer dialog, complaint sheet and similar listings.
- Sell wizard with steps, validation, photo preview, photo ordering, AI description stub, draft save and submit to moderation.
- Chat inbox/thread with listing context, composer, quick replies, mock attachments, offers and safe deal start.
- Offers with lowball warning, accept, decline and counter states.
- Favorites with saved/archive views and price/sold badges.
- Profile, my listings, notifications, moderation UX, safe deal timeline and analytics dashboard.

## Current Mock / Placeholder Areas

The UI still runs on the Stage 2 mock client state by default. Stage 3 adds Supabase infrastructure and repository adapters without forcing the frontend to switch yet.

## Stage 3 Supabase Setup

Create a Supabase project, then copy env values:

```bash
cp .env.example .env.local
```

Required variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_DATA_SOURCE=mock
```

Apply the schema with the Supabase CLI or SQL editor:

```bash
supabase db push
```

Seed electronics categories:

```bash
supabase db execute --file supabase/seed.sql
```

When backend-backed server repositories are needed, set:

```bash
NEXT_PUBLIC_DATA_SOURCE=supabase
```

The current UI remains mock-first until the next auth/listings/chat stages wire screens to Supabase-backed data flows.

## Next Stage

Stage 4 should add Auth screens/session handling and start moving protected profile flows from mock state to Supabase.

## Stage 4 Auth

Auth and profile onboarding are now available when Supabase env is configured:

- `/auth/sign-in` email/password sign in
- `/auth/sign-up` email/password registration
- `/auth/phone` phone OTP abstraction
- `/auth/callback` email callback/session exchange
- `/auth/sign-out` sign-out route
- `/onboarding` profile upsert and avatar upload to the `avatars` storage bucket
- `/profile` switches to Supabase profile data when env is present

Protected routes are enforced by `middleware.ts` only when Supabase env exists. Without env, the app keeps the Stage 2 demo/mock behavior.

## Stage 5 Listings

Real listing data is now wired when Supabase env is configured:

- Catalog reads `categories`, published/reserved `listings`, `listing_images` and user `favorites`.
- Listing detail reads the real listing, seller profile, similar listings and favorite status.
- Favorite toggle persists to the `favorites` table.
- `/favorites` reads and archives real favorites.
- `/sell` creates real listings with `draft` or `pending` status.
- Uploaded listing images go to the `listing-images` Storage bucket and create `listing_images` rows.
- `Submit to moderation` creates a `moderation_cases` row.
- `/profile/listings` reads the current user's real listings and can resubmit drafts/needs_changes or mark items sold.

## Stage 6 Realtime Chat

Chat now switches to Supabase when env is configured:

- Listing CTA creates or reuses one `conversations` row per buyer/seller/listing.
- `/chat` and `/chat/[id]` use a Supabase-backed thread screen with mock fallback.
- Messages persist to `messages` and subscribe through Supabase Realtime.
- Placeholder image/location attachments are represented as typed `attachment` messages.
- Conversation list and thread load listing context from real `listings` and `listing_images`.

## Stage 7 Offers And Reserve

Offer lifecycle is now wired to Supabase:

- Buyers can create real `offers` from listing detail or inside chat.
- Sellers can accept, decline or mark counter-offer from the chat offer panel.
- `accept_offer(p_offer_id)` atomically accepts the offer, declines other sent offers in the conversation, changes listing status to `reserved`, updates the conversation and writes a system message.
- `decline_offer(p_offer_id)` updates the offer, conversation timestamp, notification and system message.
- The UI keeps the Stage 2 lowball warning and realtime offer updates.

## Stage 8 Trust, Moderation And Reviews

Trust & Safety now switches to Supabase when env is configured:

- `/moderation` has a Supabase-backed queue for open moderation cases.
- Moderator/admin users can approve, request changes or reject listings through `moderate_listing(...)`.
- Approved listings become `published`; rejected/needs_changes listings keep seller feedback in `moderation_note`.
- Listing complaints are created from listing detail and from the moderation cabinet.
- Staff can move complaints through `reviewing`, `resolved` and `dismissed`.
- Admin users can block profiles through `block_profile(...)`; moderators/admins can update verification flags through `verify_profile(...)`.
- Reviews are read in `/profile`; completed deal review submission writes to `reviews` and refreshes `rating` / `reviews_count` through triggers.

## Stage 9 Safe Deal And Delivery

Safe deal lifecycle is now wired to Supabase:

- `/deals` switches to a Supabase-backed screen when env is configured.
- The chat safe deal CTA opens type selection for meetup, courier or Pine check.
- `create_safe_deal(p_conversation_id, p_type)` creates or reuses a deal from an accepted offer.
- Deal creation reserves the listing, keeps conversation status as `deal_started`, writes system messages and notifies both participants.
- `advance_deal(p_deal_id, p_status)` appends timeline events and updates status.
- Completing a deal marks the listing `sold`, closes the conversation and emits `deal_completed` analytics.
- Payment/escrow remains an explicit platform state machine without a real payment provider.

## Stage 10 Notifications And Analytics

Notifications and product metrics are now wired to Supabase:

- `/notifications` reads real in-app notifications, supports mark read / mark all read and subscribes to new rows through Realtime.
- Message, offer, moderation, favorite price/sold and deal status events create notifications.
- `/analytics` switches to a Supabase-backed dashboard for moderator/admin users.
- Analytics events are written by database triggers for chat started, offer sent/accepted, favorite added and deal lifecycle events.
- Listing views, search usage and filter usage are tracked from the browser through RPC helpers.
- `analytics_dashboard()` returns the MVP metrics: completed deals, started conversations, funnel conversion, offer acceptance, time to first reaction and first-pass moderation.

Still intentionally deferred:

- Real uploaded chat media/video/location Storage flow: later hardening.
- Real payment provider / escrow settlement integration.
- Rich admin audit log and role-management UI. For now, roles should be assigned directly in Supabase.
