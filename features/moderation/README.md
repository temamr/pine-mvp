# Moderation

Trust and safety UX, complaints and moderation feedback live here.

## Stage 8

- `moderation-screen.tsx` remains the mock fallback.
- `supabase-moderation-screen.tsx` is used when Supabase env is configured.
- `lib/supabase-moderation.ts` owns complaint creation, moderation decisions, complaint status updates, verification updates and admin block actions.
- Staff actions call SQL RPC functions from `supabase/migrations/202604190003_trust_safety.sql`.

Roles:

- `buyer` / `seller`: can create and track their own complaints.
- `moderator`: can read the moderation queue, decide listings, resolve complaints and update verification status.
- `admin`: can do moderator actions and block profiles.

Current admin bootstrap is manual: update `profiles.role` in Supabase for the user that should moderate.
