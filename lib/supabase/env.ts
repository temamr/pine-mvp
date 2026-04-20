export function getSupabaseBrowserEnv() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  };
}

export function isSupabaseConfigured() {
  const env = getSupabaseBrowserEnv();
  return Boolean(env.url && env.anonKey);
}

export function assertSupabaseBrowserEnv() {
  const env = getSupabaseBrowserEnv();

  if (!env.url || !env.anonKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  return {
    url: env.url,
    anonKey: env.anonKey
  };
}

export function assertSupabaseServiceRoleEnv() {
  const browserEnv = assertSupabaseBrowserEnv();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  }

  return {
    url: browserEnv.url,
    serviceRoleKey
  };
}
