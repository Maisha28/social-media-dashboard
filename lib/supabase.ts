import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY, SUPABASE_URL, hasSupabase } from "./env";

/**
 * Browser Supabase client.
 *
 * Returns null when Supabase is not configured instead of constructing a client
 * against a bogus URL. Every caller must handle null — that is the demo-mode
 * path, and it is the difference between a graceful fallback and a page full of
 * "Failed to fetch" errors.
 */
let cached: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!hasSupabase) return null;
  if (cached) return cached;
  cached = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  return cached;
}

export const isSupabaseConfigured = hasSupabase;
