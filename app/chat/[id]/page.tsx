import { ChatScreen } from "@/features/chat/components/chat-screen";
import { SupabaseChatScreen } from "@/features/chat/components/supabase-chat-screen";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export default function ConversationPage({ params }: { params: { id: string } }) {
  if (isSupabaseConfigured()) {
    return <SupabaseChatScreen initialConversationId={params.id} />;
  }

  return <ChatScreen initialConversationId={params.id} />;
}
