import type { ID, ISODate } from "@/lib/domain/common";

export type ModerationStatus = "open" | "approved" | "needs_changes" | "rejected";

export type ModerationCase = {
  id: ID;
  listingId: ID;
  status: ModerationStatus;
  moderatorId?: ID;
  note?: string;
  createdAt: ISODate;
  updatedAt: ISODate;
};

export type ComplaintTarget = "listing" | "user" | "conversation";

export type ComplaintStatus = "submitted" | "reviewing" | "resolved" | "dismissed";

export type Complaint = {
  id: ID;
  targetType: ComplaintTarget;
  targetId: ID;
  reporterId: ID;
  reason: "spam" | "fraud" | "prohibited_item" | "abuse" | "other";
  details: string;
  status: ComplaintStatus;
  createdAt: ISODate;
  updatedAt: ISODate;
};

export type Review = {
  id: ID;
  dealId: ID;
  authorId: ID;
  recipientId: ID;
  rating: 1 | 2 | 3 | 4 | 5;
  text: string;
  createdAt: ISODate;
};
