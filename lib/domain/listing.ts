import type { Address, ID, ISODate, Money } from "@/lib/domain/common";

export type ListingCondition = "new" | "like_new" | "good" | "fair" | "for_parts";

export type ListingStatus =
  | "draft"
  | "pending"
  | "published"
  | "needs_changes"
  | "rejected"
  | "reserved"
  | "sold";

export type Category = {
  id: ID;
  name: string;
  slug: string;
  icon: string;
  parentId?: ID;
};

export type ListingImage = {
  id: ID;
  url: string;
  alt: string;
  position: number;
};

export type ListingAttribute = {
  label: string;
  value: string;
};

export type Listing = {
  id: ID;
  sellerId: ID;
  categoryId: ID;
  title: string;
  description: string;
  price: Money;
  originalPrice?: Money;
  condition: ListingCondition;
  status: ListingStatus;
  images: ListingImage[];
  attributes: ListingAttribute[];
  location: Address;
  moderationNote?: string;
  isFavorite?: boolean;
  viewsCount: number;
  createdAt: ISODate;
  updatedAt: ISODate;
};

export type ListingFilters = {
  query?: string;
  categoryId?: ID;
  minPrice?: number;
  maxPrice?: number;
  condition?: ListingCondition[];
  location?: string;
  radiusKm?: number;
  sort?: "relevance" | "newest" | "price_low" | "price_high";
};
