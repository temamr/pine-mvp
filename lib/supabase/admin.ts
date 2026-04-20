import "server-only";

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { assertSupabaseServiceRoleEnv } from "@/lib/supabase/env";

export function createSupabaseAdminClient() {
  const env = assertSupabaseServiceRoleEnv();

  return createClient<Database>(env.url, env.serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}
