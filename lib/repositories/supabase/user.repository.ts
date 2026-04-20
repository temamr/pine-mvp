import type { SupabaseClient } from "@supabase/supabase-js";
import type { UserRepository } from "@/lib/repositories";
import { mapProfileToUser } from "@/lib/repositories/supabase/mappers";
import type { Database } from "@/lib/supabase/database.types";

export function createSupabaseUserRepository(client: SupabaseClient<Database>): UserRepository {
  return {
    async current() {
      const {
        data: { user },
        error: authError
      } = await client.auth.getUser();

      if (authError) {
        throw authError;
      }

      if (!user) {
        throw new Error("No active Supabase session");
      }

      const profile = await this.byId(user.id);

      if (!profile) {
        throw new Error("Missing profile for active Supabase user");
      }

      return profile;
    },

    async byId(userId) {
      const { data, error } = await client
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data ? mapProfileToUser(data) : null;
    }
  };
}
