import type { SupabaseClient } from "@supabase/supabase-js";
import type { ListingFilters } from "@/lib/domain";
import type { ListingsRepository } from "@/lib/repositories";
import type { Database } from "@/lib/supabase/database.types";
import { mapCategory, mapListing, type SupabaseListingRecord } from "@/lib/repositories/supabase/mappers";

export function createSupabaseListingsRepository(
  client: SupabaseClient<Database>
): ListingsRepository {
  const listingSelect = "*, listing_images(*)";

  return {
    async list(filters?: ListingFilters) {
      let query = client
        .from("listings")
        .select(listingSelect)
        .in("status", ["published", "reserved"]);

      if (filters?.query) {
        const term = filters.query.replaceAll(",", " ").trim();
        query = query.or(`title.ilike.%${term}%,description.ilike.%${term}%`);
      }

      if (filters?.categoryId) {
        query = query.eq("category_id", filters.categoryId);
      }

      if (filters?.minPrice !== undefined) {
        query = query.gte("price_amount", filters.minPrice);
      }

      if (filters?.maxPrice !== undefined) {
        query = query.lte("price_amount", filters.maxPrice);
      }

      if (filters?.sort === "price_low") {
        query = query.order("price_amount", { ascending: true });
      } else if (filters?.sort === "price_high") {
        query = query.order("price_amount", { ascending: false });
      } else {
        query = query.order("created_at", { ascending: false });
      }

      const { data, error } = await query.returns<SupabaseListingRecord[]>();

      if (error) {
        throw error;
      }

      return data.map(mapListing);
    },

    async featured() {
      const { data, error } = await client
        .from("listings")
        .select(listingSelect)
        .in("status", ["published", "reserved"])
        .order("created_at", { ascending: false })
        .limit(6)
        .returns<SupabaseListingRecord[]>();

      if (error) {
        throw error;
      }

      return data.map(mapListing);
    },

    async byId(id) {
      const { data, error } = await client
        .from("listings")
        .select(listingSelect)
        .eq("id", id)
        .returns<SupabaseListingRecord[]>()
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data ? mapListing(data) : null;
    },

    async categories() {
      const { data, error } = await client
        .from("categories")
        .select("*")
        .order("name", { ascending: true });

      if (error) {
        throw error;
      }

      return data.map(mapCategory);
    }
  };
}
