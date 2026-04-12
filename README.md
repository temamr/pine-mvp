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

All data is local mock data. Auth, Supabase, realtime chat transport, storage persistence, admin permissions, real payments/escrow and analytics persistence are intentionally deferred to later stages.

## Next Stage

Stage 3 should connect Supabase infrastructure while preserving the domain contracts and replacing mock repositories/actions with backend-backed adapters.
