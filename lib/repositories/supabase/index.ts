import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { createSupabaseChatRepository } from "@/lib/repositories/supabase/chat.repository";
import { createSupabaseListingsRepository } from "@/lib/repositories/supabase/listings.repository";
import { createSupabaseOffersRepository } from "@/lib/repositories/supabase/offers.repository";
import { createSupabaseUserRepository } from "@/lib/repositories/supabase/user.repository";

export function createSupabaseRepositories(client: SupabaseClient<Database>) {
  return {
    listings: createSupabaseListingsRepository(client),
    chat: createSupabaseChatRepository(client),
    offers: createSupabaseOffersRepository(client),
    users: createSupabaseUserRepository(client)
  } as const;
}
