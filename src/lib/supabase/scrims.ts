import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Database } from "@/lib/supabase/database.types";

export type ScrimRow = Database["public"]["Tables"]["scrims"]["Row"];
export type ScrimResponseRow = Database["public"]["Tables"]["scrim_responses"]["Row"];

export type ScrimResponseEntry = ScrimResponseRow & {
  profile: { username: string; display_name: string; avatar_url: string | null } | null;
  team: { name: string; tag: string } | null;
};

export type ScrimFilters = {
  region?: string;
  minRankId?: number;
  maxRankId?: number;
  /** ISO date (yyyy-mm-dd) — only scrims scheduled on/after this date. */
  afterDate?: string;
};

export async function getScrims(filters?: ScrimFilters): Promise<ScrimRow[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createClient();
  let query = supabase
    .from("scrims")
    .select("*")
    .eq("status", "open")
    .order("scheduled_for", { ascending: true });

  if (filters?.region) query = query.eq("region", filters.region);
  // Range-overlap test: a scrim with no min/max on that side accepts any rank there.
  if (filters?.minRankId !== undefined) {
    query = query.or(`max_rank_id.is.null,max_rank_id.gte.${filters.minRankId}`);
  }
  if (filters?.maxRankId !== undefined) {
    query = query.or(`min_rank_id.is.null,min_rank_id.lte.${filters.maxRankId}`);
  }
  if (filters?.afterDate) {
    query = query.gte("scheduled_for", new Date(filters.afterDate).toISOString());
  }

  const { data } = await query;
  return data ?? [];
}

export async function getScrimById(id: string): Promise<ScrimRow | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  const { data } = await supabase.from("scrims").select("*").eq("id", id).maybeSingle();
  return data ?? null;
}

export async function getScrimResponses(scrimId: string): Promise<ScrimResponseEntry[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createClient();
  const { data: responses } = await supabase
    .from("scrim_responses")
    .select("*")
    .eq("scrim_id", scrimId)
    .order("created_at", { ascending: true });

  const rows = responses ?? [];
  if (rows.length === 0) return [];

  const [{ data: profiles }, { data: teams }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url")
      .in(
        "id",
        rows.map((r) => r.responder_id),
      ),
    supabase
      .from("teams")
      .select("id, name, tag")
      .in(
        "id",
        rows.filter((r) => r.team_id).map((r) => r.team_id as string),
      ),
  ]);

  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));
  const teamById = new Map((teams ?? []).map((t) => [t.id, t]));

  return rows.map((r) => ({
    ...r,
    profile: profileById.get(r.responder_id) ?? null,
    team: r.team_id ? (teamById.get(r.team_id) ?? null) : null,
  }));
}

export async function getOwnResponse(
  scrimId: string,
  userId: string,
): Promise<ScrimResponseRow | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("scrim_responses")
    .select("*")
    .eq("scrim_id", scrimId)
    .eq("responder_id", userId)
    .maybeSingle();

  return data ?? null;
}
