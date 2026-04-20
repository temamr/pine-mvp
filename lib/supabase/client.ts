"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/supabase/database.types";
import { assertSupabaseBrowserEnv } from "@/lib/supabase/env";

export function createSupabaseBrowserClient() {
  const env = assertSupabaseBrowserEnv();
  return createBrowserClient<Database>(env.url, env.anonKey);
}
