import type { Address, ID, ISODate } from "@/lib/domain/common";

export type ConversationStatus = "active" | "archived" | "deal_started" | "completed";

export type MessageStatus = "sending" | "sent" | "delivered" | "read" | "failed";

export type MessageAttachment =
  | { type: "image"; url: string; alt: string }
  | { type: "video"; url: string; posterUrl?: string }
  | { type: "location"; address: Address };

export type Message =
  | {
      id: ID;
      conversationId: ID;
      senderId: ID;
      type: "text";
      text: string;
      status: MessageStatus;
      createdAt: ISODate;
    }
  | {
      id: ID;
      conversationId: ID;
      senderId: ID;
      type: "attachment";
      text?: string;
      attachment: MessageAttachment;
      status: MessageStatus;
      createdAt: ISODate;
    }
  | {
      id: ID;
      conversationId: ID;
      senderId: "system";
      type: "system";
      text: string;
      status: "sent";
      createdAt: ISODate;
    };

export type Conversation = {
  id: ID;
  listingId: ID;
  buyerId: ID;
  sellerId: ID;
  status: ConversationStatus;
  unreadCount: number;
  lastMessageAt: ISODate;
  createdAt: ISODate;
};
