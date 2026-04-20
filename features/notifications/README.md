# Notifications

In-app notifications and realtime notification UX live here.

## Stage 10

- `notifications-screen.tsx` remains the mock fallback.
- `supabase-notifications-screen.tsx` is used when Supabase env is configured.
- `lib/supabase-notifications.ts` loads notifications, marks one/all as read and subscribes to new notification rows.

Notification sources:

- New direct messages.
- Offer responses.
- Moderation results.
- Favorite item price changes.
- Favorite item sold.
- Safe deal status updates.

WhatsApp and SMS stay as opt-in placeholders until a provider is chosen.
