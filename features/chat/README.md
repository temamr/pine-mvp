# Chat

Conversation list, thread UI, composer and realtime adapters live here.

## Stage 6

- `components/chat-screen.tsx` remains the mock-first Stage 2 chat.
- `components/supabase-chat-screen.tsx` is used by `/chat` and `/chat/[id]` when Supabase env is configured.
- `lib/supabase-chat.ts` owns browser-side chat data access: conversation creation/reuse, thread loading, message sending, placeholder attachments and Realtime subscriptions.
- The listing detail CTA calls `startSupabaseConversation()` so UI components do not need to know table details.

Current placeholder: attachment messages create typed DB records, but real media upload to Supabase Storage is intentionally left for a later media pass.
