import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export type PugActivityStats = { totalQueued: number; activeMatches: number };

/**
 * Site-wide (not per-region) headline numbers for the /pug hero — how
 * many players are queued right now, and how many matches are being
 * played. Service-role, not the normal per-request client: pug_matches
 * isn't publicly readable (its RLS is participant-only, since the
 * lobby code lives on the same row — see the migration), so a signed-in
 * viewer's own client can only see matches *they're* in, not a real
 * site-wide count. This only ever returns two numbers, no row content,
 * so bypassing RLS for it is safe.
 */
export async function getPugActivityStats(): Promise<PugActivityStats> {
  if (!isSupabaseConfigured()) return { totalQueued: 0, activeMatches: 0 };

  const supabase = createServiceClient();

  const [{ data: queueRows }, { count: activeMatches }] = await Promise.all([
    supabase.from("pug_queue_entries").select("size").eq("status", "queued"),
    supabase
      .from("pug_matches")
      .select("id", { count: "exact", head: true })
      .in("status", ["lobby_pending", "in_progress"]),
  ]);

  const totalQueued = (queueRows ?? []).reduce((sum, r) => sum + r.size, 0);
  return { totalQueued, activeMatches: activeMatches ?? 0 };
}
