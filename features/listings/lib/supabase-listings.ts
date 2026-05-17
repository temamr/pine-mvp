"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Category, ID, Listing, ListingCondition, User } from "@/lib/domain";
import { createSupabaseRepositories } from "@/lib/repositories/supabase";
import { mapListing, mapProfileToUser, type SupabaseListingRecord } from "@/lib/repositories/supabase/mappers";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Database, Json } from "@/lib/supabase/database.types";

export type SupabaseListingDraft = {
  listingId?: ID;
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
  userId: ID | null;
  listing: Listing;
  seller: User | null;
  similar: Listing[];
  isFavorite: boolean;
  favoriteCount: number;
};

export type EditableListingDraft = {
  id: ID;
  categoryId: ID;
  title: string;
  description: string;
  price: string;
  condition: ListingCondition;
  locationLabel: string;
  imageUrls: string[];
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
  const { count: favoriteCount, error: favoriteCountError } = await client
    .from("favorites")
    .select("*", { count: "exact", head: true })
    .eq("listing_id", listing.id)
    .is("archived_at", null);

  if (favoriteCountError) {
    throw favoriteCountError;
  }

  return {
    userId: user?.id ?? null,
    listing: {
      ...listing,
      isFavorite: favoriteIds.has(listing.id)
    },
    seller: sellerRow ? mapProfileToUser(sellerRow) : null,
    similar: allListings
      .filter((item) => item.id !== listing.id)
      .slice(0, 3)
      .map((item) => ({ ...item, isFavorite: favoriteIds.has(item.id) })),
    isFavorite: favoriteIds.has(listing.id),
    favoriteCount: favoriteCount ?? 0
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
    { label: "Источник", value: "Веб-публикация" },
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
      currency: "AED",
      condition: input.condition,
      status,
      attributes,
      location: {
        city: input.locationLabel,
        region: "Dubai",
        country: "United Arab Emirates",
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

export async function fetchEditableSupabaseListing(listingId: ID): Promise<EditableListingDraft | null> {
  const client = createSupabaseBrowserClient();
  const {
    data: { user },
    error: authError
  } = await client.auth.getUser();

  if (authError) {
    throw authError;
  }

  if (!user) {
    throw new Error("Войдите, чтобы редактировать объявление.");
  }

  const { data: profile, error: profileError } = await client
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    throw profileError;
  }

  const canEditAnyListing = profile?.role === "admin";
  let query = client
    .from("listings")
    .select("*, listing_images(*)")
    .eq("id", listingId);

  if (!canEditAnyListing) {
    query = query.eq("seller_id", user.id);
  }

  const { data, error } = await query.returns<SupabaseListingRecord[]>().maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  const listing = mapListing(data);

  if (listing.status === "sold") {
    throw new Error("Проданное объявление нельзя редактировать.");
  }

  return {
    id: listing.id,
    categoryId: listing.categoryId,
    title: listing.title,
    description: listing.description,
    price: String(listing.price.amount),
    condition: listing.condition,
    locationLabel: listing.location.label,
    imageUrls: listing.images.map((image) => image.url)
  };
}

export async function updateSupabaseListingFromDraft(input: SupabaseListingDraft & { listingId: ID }): Promise<Listing> {
  const client = createSupabaseBrowserClient();
  const {
    data: { user },
    error: authError
  } = await client.auth.getUser();

  if (authError) {
    throw authError;
  }

  if (!user) {
    throw new Error("Войдите, чтобы редактировать объявление.");
  }

  const status = input.submitToModeration ? "pending" : "draft";
  const attributes: Json = [
    { label: "Источник", value: "Веб-публикация" },
    { label: "Готовность", value: input.submitToModeration ? "На модерации" : "Черновик" }
  ];

  const { data: profile, error: profileError } = await client
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    throw profileError;
  }

  const canEditAnyListing = profile?.role === "admin";
  let existingQuery = client
    .from("listings")
    .select("status")
    .eq("id", input.listingId);

  if (!canEditAnyListing) {
    existingQuery = existingQuery.eq("seller_id", user.id);
  }

  const { data: existingListing, error: existingListingError } = await existingQuery.single();

  if (existingListingError) {
    throw existingListingError;
  }

  if (existingListing.status === "sold") {
    throw new Error("Проданное объявление нельзя редактировать.");
  }

  let updateQuery = client
    .from("listings")
    .update({
      category_id: input.categoryId,
      title: input.title,
      description: input.description,
      price_amount: input.price,
      currency: "AED",
      condition: input.condition,
      status,
      moderation_note: null,
      attributes,
      location: {
        city: input.locationLabel,
        region: "Dubai",
        country: "United Arab Emirates",
        label: input.locationLabel
      }
    })
    .eq("id", input.listingId);

  if (!canEditAnyListing) {
    updateQuery = updateQuery.eq("seller_id", user.id);
  }

  const { data: listingRow, error: listingError } = await updateQuery
    .select("*, listing_images(*)")
    .returns<SupabaseListingRecord[]>()
    .single();

  if (listingError) {
    throw listingError;
  }

  await client.from("listing_images").delete().eq("listing_id", input.listingId);
  const imageRows = await uploadAndInsertImages(client, input.listingId, input);

  if (input.submitToModeration) {
    const { error } = await client.from("moderation_cases").insert({
      listing_id: input.listingId,
      status: "open",
      note: "Объявление обновлено и отправлено на повторную проверку."
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
  const imageInputs = input.imageUrls.slice(0, 10);
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
