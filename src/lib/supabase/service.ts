import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

/**
 * Service-role client — bypasses RLS entirely. Reserved for operations
 * that are inherently cross-user and trusted (right now: only PUG
 * matchmaking, which has to read the whole region's queue and write
 * match rows for players other than whoever's request triggered it).
 * Never import this into anything a Client Component could reach.
 */
export function createServiceClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
