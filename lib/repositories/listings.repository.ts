import type { AsyncResult, Category, ID, Listing, ListingFilters } from "@/lib/domain";

export type ListingsRepository = {
  list(filters?: ListingFilters): AsyncResult<Listing[]>;
  featured(): AsyncResult<Listing[]>;
  byId(id: ID): AsyncResult<Listing | null>;
  categories(): AsyncResult<Category[]>;
};
