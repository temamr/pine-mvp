import type { ID, ISODate } from "@/lib/domain/common";

export type Favorite = {
  id: ID;
  userId: ID;
  listingId: ID;
  archivedAt?: ISODate;
  priceChangedAt?: ISODate;
  soldNotifiedAt?: ISODate;
  createdAt: ISODate;
};
