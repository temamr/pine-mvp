"use client";

import type { Complaint, Conversation, ID, Listing, ModerationCase, User } from "@/lib/domain";
import {
  mapComplaint,
  mapConversation,
  mapListing,
  mapModerationCase,
  mapProfileToUser,
  type SupabaseListingRecord
} from "@/lib/repositories/supabase/mappers";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Database, Tables } from "@/lib/supabase/database.types";

export type SupabaseModerationData = {
  userId: ID | null;
  profile: Tables<"profiles"> | null;
  isStaff: boolean;
  isAdmin: boolean;
  cases: ModerationCase[];
  complaints: Complaint[];
  listingsById: Record<ID, Listing>;
  conversationsById: Record<ID, Conversation>;
  usersById: Record<ID, User>;
  listingsBySellerId: Record<ID, Listing[]>;
};

export async function fetchSupabaseModerationData(): Promise<SupabaseModerationData> {
  const client = createSupabaseBrowserClient();
  const {
    data: { user },
    error: authError
  } = await client.auth.getUser();

  if (authError) {
    throw authError;
  }

  if (!user) {
    return emptyData();
  }

  const { data: profile, error: profileError } = await client
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    throw profileError;
  }

  const isStaff = profile?.role === "moderator" || profile?.role === "admin";
  const isAdmin = profile?.role === "admin";

  const casesQuery = client
    .from("moderation_cases")
    .select("*")
    .order("created_at", { ascending: false });
  const complaintsQuery = client
    .from("complaints")
    .select("*")
    .order("created_at", { ascending: false });

  const [{ data: caseRows, error: caseError }, { data: complaintRows, error: complaintError }] = await Promise.all([
    isStaff ? casesQuery.eq("status", "open") : casesQuery.limit(20),
    isStaff ? complaintsQuery.limit(100) : complaintsQuery.eq("reporter_id", user.id).limit(100)
  ]);

  if (caseError) {
    throw caseError;
  }

  if (complaintError) {
    throw complaintError;
  }

  const cases = caseRows.map(mapModerationCase);
  const complaints = complaintRows.map(mapComplaint);
  const conversationIds = [...new Set(complaints.filter((item) => item.targetType === "conversation").map((item) => item.targetId))];
  const conversationsById = await loadConversationsById(conversationIds);
  const listingIds = [
    ...cases.map((item) => item.listingId),
    ...complaints.filter((item) => item.targetType === "listing").map((item) => item.targetId),
    ...Object.values(conversationsById).map((conversation) => conversation.listingId)
  ];
  const listingsById = await loadListingsById([...new Set(listingIds)]);
  const userIds = new Set<ID>([...complaints.map((item) => item.reporterId)]);

  cases.forEach((caseItem) => {
    const listing = listingsById[caseItem.listingId];
    if (listing) {
      userIds.add(listing.sellerId);
    }
  });

  complaints.forEach((complaint) => {
    if (complaint.targetType === "user") {
      userIds.add(complaint.targetId);
    }

    if (complaint.targetType === "listing") {
      const listing = listingsById[complaint.targetId];
      if (listing) {
        userIds.add(listing.sellerId);
      }
    }
  });

  const usersById = await loadUsersById([...userIds]);
  const listingsBySellerId = groupListingsBySeller(listingsById);

  return {
    userId: user.id,
    profile,
    isStaff,
    isAdmin,
    cases,
    complaints,
    listingsById,
    conversationsById,
    usersById,
    listingsBySellerId
  };
}

export async function createSupabaseComplaint(input: {
  targetType: Complaint["targetType"];
  targetId: ID;
  reason: Complaint["reason"];
  details: string;
}): Promise<Complaint> {
  const client = createSupabaseBrowserClient();
  const {
    data: { user },
    error: authError
  } = await client.auth.getUser();

  if (authError) {
    throw authError;
  }

  if (!user) {
    throw new Error("Войдите, чтобы отправить жалобу.");
  }

  const { data, error } = await client
    .from("complaints")
    .insert({
      target_type: input.targetType,
      target_id: input.targetId,
      reporter_id: user.id,
      reason: input.reason,
      details: input.details
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return mapComplaint(data);
}

export async function decideSupabaseModeration(
  listingId: ID,
  decision: Exclude<ModerationCase["status"], "open">,
  note?: string
): Promise<ModerationCase> {
  const client = createSupabaseBrowserClient();
  const { data, error } = await client.rpc("moderate_listing", {
    p_listing_id: listingId,
    p_decision: decision,
    p_note: note ?? null
  });

  if (error) {
    throw error;
  }

  return mapModerationCase(data);
}

export async function updateSupabaseComplaintStatus(
  complaintId: ID,
  status: Exclude<Complaint["status"], "submitted">
): Promise<Complaint> {
  const client = createSupabaseBrowserClient();
  const { data, error } = await client.rpc("resolve_complaint", {
    p_complaint_id: complaintId,
    p_status: status
  });

  if (error) {
    throw error;
  }

  return mapComplaint(data);
}

export async function blockSupabaseProfile(profileId: ID, reason?: string): Promise<User> {
  const client = createSupabaseBrowserClient();
  const { data, error } = await client.rpc("block_profile", {
    p_profile_id: profileId,
    p_reason: reason ?? null
  });

  if (error) {
    throw error;
  }

  return mapProfileToUser(data);
}

export async function verifySupabaseProfile(
  profileId: ID,
  status: Database["public"]["Enums"]["verification_status"]
): Promise<User> {
  const client = createSupabaseBrowserClient();
  const { data, error } = await client.rpc("verify_profile", {
    p_profile_id: profileId,
    p_status: status
  });

  if (error) {
    throw error;
  }

  return mapProfileToUser(data);
}

async function loadListingsById(listingIds: ID[]) {
  if (!listingIds.length) {
    return {};
  }

  const client = createSupabaseBrowserClient();
  const { data, error } = await client
    .from("listings")
    .select("*, listing_images(*)")
    .in("id", listingIds)
    .returns<SupabaseListingRecord[]>();

  if (error) {
    throw error;
  }

  return Object.fromEntries(data.map((listing) => [listing.id, mapListing(listing)]));
}

async function loadUsersById(userIds: ID[]) {
  if (!userIds.length) {
    return {};
  }

  const client = createSupabaseBrowserClient();
  const { data, error } = await client
    .from("profiles")
    .select("*")
    .in("id", userIds);

  if (error) {
    throw error;
  }

  return Object.fromEntries(data.map((profile) => [profile.id, mapProfileToUser(profile)]));
}

async function loadConversationsById(conversationIds: ID[]) {
  if (!conversationIds.length) {
    return {};
  }

  const client = createSupabaseBrowserClient();
  const { data, error } = await client.from("conversations").select("*").in("id", conversationIds);

  if (error) {
    throw error;
  }

  return Object.fromEntries(data.map((conversation) => [conversation.id, mapConversation(conversation)]));
}

function groupListingsBySeller(listingsById: Record<ID, Listing>) {
  return Object.values(listingsById).reduce<Record<ID, Listing[]>>((acc, listing) => {
    acc[listing.sellerId] = [...(acc[listing.sellerId] ?? []), listing].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return acc;
  }, {});
}

function emptyData(): SupabaseModerationData {
  return {
    userId: null,
    profile: null,
    isStaff: false,
    isAdmin: false,
    cases: [],
    complaints: [],
    listingsById: {},
    conversationsById: {},
    usersById: {},
    listingsBySellerId: {}
  };
}
