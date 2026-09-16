import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let adminInstance: SupabaseClient | null = null;
let authInstance: SupabaseClient | null = null;

/* ==========================================================
   PLATFORM API 001
   Server-side Supabase clients
   ========================================================== */

function getSupabaseUrl(): string {
  const supabaseUrl =
    process.env.SUPABASE_URL?.trim() ??
    process.env.VITE_SUPABASE_URL?.trim();

  if (!supabaseUrl) {
    throw new Error("SUPABASE_URL is not configured.");
  }

  return supabaseUrl;
}

function getSupabasePublishableKey(): string {
  const publishableKey =
    process.env.SUPABASE_PUBLISHABLE_KEY?.trim() ??
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();

  if (!publishableKey) {
    throw new Error(
      "SUPABASE_PUBLISHABLE_KEY or VITE_SUPABASE_PUBLISHABLE_KEY is not configured.",
    );
  }

  return publishableKey;
}

export function getSupabaseAuthClient(): SupabaseClient {
  if (authInstance) {
    return authInstance;
  }

  authInstance = createClient(
    getSupabaseUrl(),
    getSupabasePublishableKey(),
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  );

  return authInstance;
}

export function getSupabaseAdmin(): SupabaseClient {
  if (adminInstance) {
    return adminInstance;
  }

  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured.");
  }

  adminInstance = createClient(
    getSupabaseUrl(),
    serviceRoleKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  );

  return adminInstance;
}
