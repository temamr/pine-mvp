import type { ID, ISODate } from "@/lib/domain/common";

export type NotificationType =
  | "message"
  | "offer_response"
  | "moderation"
  | "favorite_price_changed"
  | "favorite_sold"
  | "deal_status";

export type Notification = {
  id: ID;
  userId: ID;
  type: NotificationType;
  title: string;
  body: string;
  href?: string;
  readAt?: ISODate;
  createdAt: ISODate;
};
