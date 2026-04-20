import type {
  Address,
  Category,
  Complaint,
  Conversation,
  Deal,
  Listing,
  ListingAttribute,
  ListingImage,
  Message,
  MessageAttachment,
  ModerationCase,
  Notification,
  Offer,
  Review,
  User
} from "@/lib/domain";
import type { Json, Tables } from "@/lib/supabase/database.types";

export type SupabaseListingRecord = Tables<"listings"> & {
  listing_images: Tables<"listing_images">[] | null;
};

function jsonObject(value: Json | null | undefined): Record<string, Json | undefined> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value;
  }

  return {};
}

function stringValue(value: Json | undefined, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function numberValue(value: Json | undefined) {
  return typeof value === "number" ? value : undefined;
}

function stringOrUndefined(value: Json | undefined) {
  return typeof value === "string" ? value : undefined;
}

function mapAddress(value: Json | null): Address {
  const record = jsonObject(value);
  const point = jsonObject(record.point ?? null);
  const lat = numberValue(point.lat);
  const lng = numberValue(point.lng);

  return {
    city: stringValue(record.city, "Unknown"),
    region: stringValue(record.region, ""),
    country: stringValue(record.country, ""),
    label: stringValue(record.label, "Unknown location"),
    point: lat !== undefined && lng !== undefined ? { lat, lng } : undefined
  };
}

function mapAttributes(value: Json): ListingAttribute[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    const record = jsonObject(item);
    const label = stringValue(record.label);
    const attributeValue = stringValue(record.value);

    return label && attributeValue ? [{ label, value: attributeValue }] : [];
  });
}

function mapImages(images: Tables<"listing_images">[] | null): ListingImage[] {
  return [...(images ?? [])]
    .sort((a, b) => a.position - b.position)
    .map((image) => ({
      id: image.id,
      url: image.url,
      alt: image.alt,
      position: image.position
    }));
}

function mapAttachment(value: Json | null): MessageAttachment {
  const record = jsonObject(value);
  const type = stringValue(record.type);

  if (type === "video") {
    return {
      type: "video",
      url: stringValue(record.url),
      posterUrl: stringValue(record.posterUrl) || undefined
    };
  }

  if (type === "location") {
    return {
      type: "location",
      address: mapAddress(record.address ?? null)
    };
  }

  return {
    type: "image",
    url: stringValue(record.url),
    alt: stringValue(record.alt, "Attachment")
  };
}

export function mapProfileToUser(row: Tables<"profiles">): User {
  return {
    id: row.id,
    displayName: row.display_name,
    email: row.email ?? undefined,
    phone: row.phone ?? undefined,
    avatarUrl: row.avatar_url ?? undefined,
    bio: row.bio ?? undefined,
    role: row.role,
    verificationStatus: row.verification_status,
    rating: row.rating,
    reviewsCount: row.reviews_count,
    completedDealsCount: row.completed_deals_count,
    location: row.location ? mapAddress(row.location) : undefined,
    createdAt: row.created_at
  };
}

export function mapModerationCase(row: Tables<"moderation_cases">): ModerationCase {
  return {
    id: row.id,
    listingId: row.listing_id,
    status: row.status,
    moderatorId: row.moderator_id ?? undefined,
    note: row.note ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function mapComplaint(row: Tables<"complaints">): Complaint {
  return {
    id: row.id,
    targetType: row.target_type,
    targetId: row.target_id,
    reporterId: row.reporter_id,
    reason: row.reason,
    details: row.details,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function ratingValue(value: number): Review["rating"] {
  if (value <= 1) return 1;
  if (value === 2) return 2;
  if (value === 3) return 3;
  if (value === 4) return 4;
  return 5;
}

export function mapReview(row: Tables<"reviews">): Review {
  return {
    id: row.id,
    dealId: row.deal_id,
    authorId: row.author_id,
    recipientId: row.recipient_id,
    rating: ratingValue(row.rating),
    text: row.text,
    createdAt: row.created_at
  };
}

export function mapNotification(row: Tables<"notifications">): Notification {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    title: row.title,
    body: row.body,
    href: row.href ?? undefined,
    readAt: row.read_at ?? undefined,
    createdAt: row.created_at
  };
}

export function mapCategory(row: Tables<"categories">): Category {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    icon: row.icon,
    parentId: row.parent_id ?? undefined
  };
}

export function mapListing(row: SupabaseListingRecord): Listing {
  return {
    id: row.id,
    sellerId: row.seller_id,
    categoryId: row.category_id,
    title: row.title,
    description: row.description,
    price: {
      amount: row.price_amount,
      currency: row.currency
    },
    originalPrice: row.original_price_amount
      ? {
          amount: row.original_price_amount,
          currency: row.currency
        }
      : undefined,
    condition: row.condition,
    status: row.status,
    images: mapImages(row.listing_images),
    attributes: mapAttributes(row.attributes),
    location: mapAddress(row.location),
    moderationNote: row.moderation_note ?? undefined,
    viewsCount: row.views_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function mapConversation(row: Tables<"conversations">): Conversation {
  return {
    id: row.id,
    listingId: row.listing_id,
    buyerId: row.buyer_id,
    sellerId: row.seller_id,
    status: row.status,
    unreadCount: row.unread_count,
    lastMessageAt: row.last_message_at,
    createdAt: row.created_at
  };
}

export function mapMessage(row: Tables<"messages">): Message {
  if (row.type === "system") {
    return {
      id: row.id,
      conversationId: row.conversation_id,
      senderId: "system",
      type: "system",
      text: row.text ?? "",
      status: "sent",
      createdAt: row.created_at
    };
  }

  if (row.type === "attachment") {
    return {
      id: row.id,
      conversationId: row.conversation_id,
      senderId: row.sender_id ?? "system",
      type: "attachment",
      text: row.text ?? undefined,
      attachment: mapAttachment(row.attachment),
      status: row.status,
      createdAt: row.created_at
    };
  }

  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id ?? "system",
    type: "text",
    text: row.text ?? "",
    status: row.status,
    createdAt: row.created_at
  };
}

export function mapOffer(row: Tables<"offers">): Offer {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    listingId: row.listing_id,
    buyerId: row.buyer_id,
    sellerId: row.seller_id,
    amount: {
      amount: row.amount,
      currency: row.currency
    },
    status: row.status,
    message: row.message ?? undefined,
    expiresAt: row.expires_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapDealTimeline(value: Json): Deal["timeline"] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item, index) => {
    const record = jsonObject(item);
    const label = stringValue(record.label);
    const description = stringValue(record.description);
    const createdAt = stringOrUndefined(record.createdAt) ?? stringOrUndefined(record.created_at);

    if (!label || !description || !createdAt) {
      return [];
    }

    return [
      {
        id: stringOrUndefined(record.id) ?? `${createdAt}-${index}`,
        label,
        description,
        createdAt
      }
    ];
  });
}

export function mapDeal(row: Tables<"deals">): Deal {
  return {
    id: row.id,
    listingId: row.listing_id,
    conversationId: row.conversation_id,
    buyerId: row.buyer_id,
    sellerId: row.seller_id,
    acceptedOfferId: row.accepted_offer_id ?? undefined,
    type: row.type,
    status: row.status,
    amount: {
      amount: row.amount,
      currency: row.currency
    },
    timeline: mapDealTimeline(row.timeline),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}
