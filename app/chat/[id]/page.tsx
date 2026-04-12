import { ChatScreen } from "@/features/chat/components/chat-screen";

export default function ConversationPage({ params }: { params: { id: string } }) {
  return <ChatScreen initialConversationId={params.id} />;
}
