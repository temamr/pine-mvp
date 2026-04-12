import type { Address, ID, ISODate } from "@/lib/domain/common";

export type VerificationStatus = "none" | "phone" | "document" | "trusted";

export type UserRole = "buyer" | "seller" | "moderator" | "admin";

export type User = {
  id: ID;
  displayName: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  bio?: string;
  role: UserRole;
  verificationStatus: VerificationStatus;
  rating: number;
  reviewsCount: number;
  completedDealsCount: number;
  location?: Address;
  createdAt: ISODate;
};
