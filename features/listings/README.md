# Listings

Catalog, listing cards, detail view and creation wizard live here.

Stage 5 adds Supabase-backed listing flows while preserving mock fallback:

- `components/catalog-screen.tsx` switches to Supabase catalog data when env is configured.
- `components/listing-detail-screen.tsx` loads listing/seller/similar/favorite state from Supabase.
- `components/sell-wizard-screen.tsx` creates listings, uploads images and submits moderation cases.
- `lib/supabase-listings.ts` contains the client data helpers used by these screens.
