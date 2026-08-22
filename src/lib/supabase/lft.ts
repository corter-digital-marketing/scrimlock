import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { ProfileRow } from "@/lib/supabase/profiles";

export type LftFilters = {
  region?: string;
  minRankId?: number;
  maxRankId?: number;
  heroId?: string;
};

/** Players with is_lft = true — the "Players looking for team" view. */
export async function getLftPlayers(filters?: LftFilters): Promise<ProfileRow[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createClient();
  let query = supabase
    .from("profiles")
    .select("*")
    .eq("is_lft", true)
    .order("updated_at", { ascending: false });

  if (filters?.region) query = query.eq("region", filters.region);
  if (filters?.minRankId !== undefined) query = query.gte("rank_id", filters.minRankId);
  if (filters?.maxRankId !== undefined) query = query.lte("rank_id", filters.maxRankId);
  if (filters?.heroId) query = query.contains("preferred_heroes", [filters.heroId]);

  const { data } = await query;
  return data ?? [];
}
