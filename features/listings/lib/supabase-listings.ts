"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Category, ID, Listing, ListingCondition, User } from "@/lib/domain";
import { createSupabaseRepositories } from "@/lib/repositories/supabase";
import { mapListing, mapProfileToUser, type SupabaseListingRecord } from "@/lib/repositories/supabase/mappers";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Database, Json } from "@/lib/supabase/database.types";

export type SupabaseListingDraft = {
  categoryId: ID;
  title: string;
  description: string;
  price: number;
  condition: ListingCondition;
  locationLabel: string;
  imageUrls: string[];
  imageFiles: Array<File | null>;
  submitToModeration: boolean;
};

export type ListingDetailsData = {
  listing: Listing;
  seller: User | null;
  similar: Listing[];
  isFavorite: boolean;
};

export function getSupabaseListingsClient() {
  const client = createSupabaseBrowserClient();
  const repositories = createSupabaseRepositories(client);
  return { client, repositories };
}

export async function fetchSupabaseCatalogData() {
  const { client, repositories } = getSupabaseListingsClient();
  const [
    {
      data: { user }
    },
    categories,
    listings
  ] = await Promise.all([
    client.auth.getUser(),
    repositories.listings.categories(),
    repositories.listings.list({ sort: "newest" })
  ]);

  const favoriteIds = user ? await fetchFavoriteIds(client, user.id) : new Set<string>();

  return {
    categories,
    listings: listings.map((listing) => ({
      ...listing,
      isFavorite: favoriteIds.has(listing.id)
    })),
    userId: user?.id ?? null
  };
}

export async function fetchSupabaseListingDetails(listingId: ID): Promise<ListingDetailsData | null> {
  const { client, repositories } = getSupabaseListingsClient();
  const [
    {
      data: { user }
    },
    listing
  ] = await Promise.all([client.auth.getUser(), repositories.listings.byId(listingId)]);

  if (!listing) {
    return null;
  }

  const [{ data: sellerRow }, allListings, favoriteIds] = await Promise.all([
    client.from("profiles").select("*").eq("id", listing.sellerId).maybeSingle(),
    repositories.listings.list({ categoryId: listing.categoryId, sort: "newest" }),
    user ? fetchFavoriteIds(client, user.id) : Promise.resolve(new Set<string>())
  ]);

  return {
    listing: {
      ...listing,
      isFavorite: favoriteIds.has(listing.id)
    },
    seller: sellerRow ? mapProfileToUser(sellerRow) : null,
    similar: allListings
      .filter((item) => item.id !== listing.id)
      .slice(0, 3)
      .map((item) => ({ ...item, isFavorite: favoriteIds.has(item.id) })),
    isFavorite: favoriteIds.has(listing.id)
  };
}

export async function fetchFavoriteIds(
  client: SupabaseClient<Database>,
  userId: ID
): Promise<Set<ID>> {
  const { data, error } = await client
    .from("favorites")
    .select("listing_id")
    .eq("user_id", userId)
    .is("archived_at", null);

  if (error) {
    throw error;
  }

  return new Set(data.map((favorite) => favorite.listing_id));
}

export async function toggleSupabaseFavorite(listingId: ID) {
  const client = createSupabaseBrowserClient();
  const {
    data: { user },
    error: authError
  } = await client.auth.getUser();

  if (authError) {
    throw authError;
  }

  if (!user) {
    return { requiresAuth: true, isFavorite: false };
  }

  const { data: existing, error: existingError } = await client
    .from("favorites")
    .select("id, archived_at")
    .eq("user_id", user.id)
    .eq("listing_id", listingId)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  if (existing && !existing.archived_at) {
    const { error } = await client.from("favorites").delete().eq("id", existing.id);
    if (error) {
      throw error;
    }

    return { requiresAuth: false, isFavorite: false };
  }

  if (existing?.archived_at) {
    const { error } = await client
      .from("favorites")
      .update({ archived_at: null })
      .eq("id", existing.id);
    if (error) {
      throw error;
    }
  } else {
    const { error } = await client.from("favorites").insert({
      user_id: user.id,
      listing_id: listingId
    });
    if (error) {
      throw error;
    }
  }

  return { requiresAuth: false, isFavorite: true };
}

export async function createSupabaseListingFromDraft(input: SupabaseListingDraft): Promise<Listing> {
  const client = createSupabaseBrowserClient();
  const {
    data: { user },
    error: authError
  } = await client.auth.getUser();

  if (authError) {
    throw authError;
  }

  if (!user) {
    throw new Error("Войдите, чтобы создать объявление.");
  }

  const status = input.submitToModeration ? "pending" : "draft";
  const attributes: Json = [
    { label: "Источник", value: "Supabase listing wizard" },
    { label: "Готовность", value: input.submitToModeration ? "На модерации" : "Черновик" }
  ];

  const { data: listingRow, error: listingError } = await client
    .from("listings")
    .insert({
      seller_id: user.id,
      category_id: input.categoryId,
      title: input.title,
      description: input.description,
      price_amount: input.price,
      currency: "USD",
      condition: input.condition,
      status,
      attributes,
      location: {
        city: input.locationLabel,
        region: "CA",
        country: "US",
        label: input.locationLabel
      }
    })
    .select("*, listing_images(*)")
    .returns<SupabaseListingRecord[]>()
    .single();

  if (listingError) {
    throw listingError;
  }

  const imageRows = await uploadAndInsertImages(client, listingRow.id, input);

  if (input.submitToModeration) {
    const { error } = await client.from("moderation_cases").insert({
      listing_id: listingRow.id,
      status: "open",
      note: "Объявление ожидает первой проверки."
    });

    if (error) {
      throw error;
    }
  }

  return mapListing({
    ...listingRow,
    listing_images: imageRows
  });
}

async function uploadAndInsertImages(
  client: SupabaseClient<Database>,
  listingId: ID,
  input: SupabaseListingDraft
) {
  const fallbackImages =
    input.imageUrls.length > 0
      ? input.imageUrls
      : ["https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=900&q=80"];

  const imageInputs = fallbackImages.slice(0, 10);
  const rows = await Promise.all(
    imageInputs.map(async (url, index) => {
      const file = input.imageFiles[index];

      if (file) {
        const extension = file.name.split(".").pop() ?? "jpg";
        const path = `${listingId}/${Date.now()}-${index}.${extension}`;
        const { error: uploadError } = await client.storage
          .from("listing-images")
          .upload(path, file, {
            contentType: file.type,
            upsert: true
          });

        if (uploadError) {
          throw uploadError;
        }

        const { data } = client.storage.from("listing-images").getPublicUrl(path);

        return {
          listing_id: listingId,
          storage_path: path,
          url: data.publicUrl,
          alt: input.title,
          position: index
        };
      }

      return {
        listing_id: listingId,
        storage_path: null,
        url,
        alt: input.title,
        position: index
      };
    })
  );

  const { data, error } = await client
    .from("listing_images")
    .insert(rows)
    .select("*")
    .order("position", { ascending: true });

  if (error) {
    throw error;
  }

  return data;
}

export function categoriesFallback(categories: Category[], fallback: Category[]) {
  return categories.length > 0 ? categories : fallback;
}
