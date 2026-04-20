import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { Database } from "@/lib/supabase/database.types";
import { assertSupabaseBrowserEnv } from "@/lib/supabase/env";

export function createSupabaseServerClient() {
  const env = assertSupabaseBrowserEnv();
  const cookieStore = cookies();

  return createServerClient<Database>(env.url, env.anonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch {
          // Server Components cannot set cookies. Route handlers and server actions can.
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: "", ...options });
        } catch {
          // Server Components cannot set cookies. Route handlers and server actions can.
        }
      }
    }
  });
}
