import { ChatScreen } from "@/features/chat/components/chat-screen";
import { SupabaseChatScreen } from "@/features/chat/components/supabase-chat-screen";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export default function ChatPage() {
  if (isSupabaseConfigured()) {
    return <SupabaseChatScreen />;
  }

  return <ChatScreen />;
}
