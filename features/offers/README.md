# Offers

Offer creation, lowball warnings and accept/reject/counter flows live here.

## Stage 7

- Buyers create `offers` in Supabase from listing detail and from the chat offer panel.
- Sellers manage sent offers inside `SupabaseChatScreen`.
- Accept and decline use SQL RPC functions from `supabase/migrations/202604190002_chat_offers.sql`.
- Accept is transaction-safe for the MVP: the accepted offer is locked, competing sent offers are declined, the listing becomes `reserved`, the conversation becomes `deal_started`, and a system message is written.
- Counter-offer is currently a persisted `countered` status plus system message. A richer counter amount flow can build on the same table later.
