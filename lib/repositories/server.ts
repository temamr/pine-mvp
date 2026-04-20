import "server-only";

import { repositories as mockRepositories } from "@/lib/mock/repositories";
import { createSupabaseRepositories } from "@/lib/repositories/supabase";
import { getSupabaseBrowserEnv } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export function getServerRepositories() {
  const env = getSupabaseBrowserEnv();
  const dataSource = process.env.NEXT_PUBLIC_DATA_SOURCE;

  if (dataSource === "supabase" && env.url && env.anonKey) {
    return createSupabaseRepositories(createSupabaseServerClient());
  }

  return mockRepositories;
}
