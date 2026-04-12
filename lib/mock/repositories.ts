import type { ChatRepository, ListingsRepository, OffersRepository, UserRepository } from "@/lib/repositories";
import type { Listing, Offer } from "@/lib/domain";
import {
  mockCategories,
  mockConversations,
  mockListings,
  mockMessages,
  mockOffers,
  mockUsers
} from "@/lib/mock/fixtures";
import { delay } from "@/lib/mock/delay";

function filterListings(listings: Listing[], query?: string) {
  if (!query) {
    return listings;
  }

  const normalized = query.trim().toLowerCase();
  return listings.filter((listing) =>
    [listing.title, listing.description, listing.location.label]
      .join(" ")
      .toLowerCase()
      .includes(normalized)
  );
}

export const mockListingsRepository: ListingsRepository = {
  async list(filters) {
    let listings = [...mockListings];

    listings = filterListings(listings, filters?.query);

    if (filters?.categoryId) {
      listings = listings.filter((listing) => listing.categoryId === filters.categoryId);
    }

    if (filters?.minPrice !== undefined) {
      const minPrice = filters.minPrice;
      listings = listings.filter((listing) => listing.price.amount >= minPrice);
    }

    if (filters?.maxPrice !== undefined) {
      const maxPrice = filters.maxPrice;
      listings = listings.filter((listing) => listing.price.amount <= maxPrice);
    }

    if (filters?.sort === "price_low") {
      listings.sort((a, b) => a.price.amount - b.price.amount);
    }

    if (filters?.sort === "price_high") {
      listings.sort((a, b) => b.price.amount - a.price.amount);
    }

    if (filters?.sort === "newest") {
      listings.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }

    return delay(listings);
  },
  async featured() {
    return delay(mockListings.slice(0, 3));
  },
  async byId(id) {
    return delay(mockListings.find((listing) => listing.id === id) ?? null);
  },
  async categories() {
    return delay(mockCategories);
  }
};

export const mockChatRepository: ChatRepository = {
  async listConversations(userId) {
    return delay(
      mockConversations.filter(
        (conversation) => conversation.buyerId === userId || conversation.sellerId === userId
      )
    );
  },
  async byId(conversationId) {
    return delay(mockConversations.find((conversation) => conversation.id === conversationId) ?? null);
  },
  async messages(conversationId) {
    return delay(mockMessages.filter((message) => message.conversationId === conversationId));
  }
};

export const mockOffersRepository: OffersRepository = {
  async listByConversation(conversationId) {
    return delay(mockOffers.filter((offer) => offer.conversationId === conversationId));
  },
  async create(input) {
    const offer: Offer = {
      id: `offer_${Date.now()}`,
      ...input,
      status: "sent",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return delay(offer);
  }
};

export const mockUserRepository: UserRepository = {
  async current() {
    return delay(mockUsers[1]);
  },
  async byId(userId) {
    return delay(mockUsers.find((user) => user.id === userId) ?? null);
  }
};

export const repositories = {
  listings: mockListingsRepository,
  chat: mockChatRepository,
  offers: mockOffersRepository,
  users: mockUserRepository
} as const;
