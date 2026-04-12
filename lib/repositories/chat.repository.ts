import type { AsyncResult, Conversation, ID, Message } from "@/lib/domain";

export type ChatRepository = {
  listConversations(userId: ID): AsyncResult<Conversation[]>;
  byId(conversationId: ID): AsyncResult<Conversation | null>;
  messages(conversationId: ID): AsyncResult<Message[]>;
};
