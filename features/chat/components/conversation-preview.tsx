import { MessageCircle } from "lucide-react";
import type { Conversation, Listing } from "@/lib/domain";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatRelativeDate } from "@/lib/utils/format";

export function ConversationPreview({
  conversation,
  listing
}: {
  conversation: Conversation;
  listing?: Listing;
}) {
  return (
    <Card className="bg-white/92">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageCircle className="h-4 w-4 text-primary" />
            {listing?.title ?? "Диалог"}
          </CardTitle>
          {conversation.unreadCount > 0 ? <Badge variant="secondary">{conversation.unreadCount} новых</Badge> : null}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Последняя активность {formatRelativeDate(conversation.lastMessageAt)}
        </p>
      </CardContent>
    </Card>
  );
}
