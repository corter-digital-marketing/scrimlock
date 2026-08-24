import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Database, TournamentStatus } from "@/lib/supabase/database.types";

export type TournamentRow = Database["public"]["Tables"]["tournaments"]["Row"];

export type TournamentFilters = {
  region?: string;
  status?: TournamentStatus;
  minRankId?: number;
  maxRankId?: number;
};

export async function getTournaments(filters?: TournamentFilters): Promise<TournamentRow[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createClient();
  let query = supabase
    .from("tournaments")
    .select("*")
    .neq("status", "draft")
    .order("starts_at", { ascending: true });

  if (filters?.region) query = query.eq("region", filters.region);
  if (filters?.status) query = query.eq("status", filters.status);
  if (filters?.minRankId !== undefined) {
    query = query.or(`max_rank_id.is.null,max_rank_id.gte.${filters.minRankId}`);
  }
  if (filters?.maxRankId !== undefined) {
    query = query.or(`min_rank_id.is.null,min_rank_id.lte.${filters.maxRankId}`);
  }

  const { data } = await query;
  return data ?? [];
}

export async function getTournamentById(id: string): Promise<TournamentRow | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  const { data } = await supabase.from("tournaments").select("*").eq("id", id).maybeSingle();
  return data ?? null;
}
