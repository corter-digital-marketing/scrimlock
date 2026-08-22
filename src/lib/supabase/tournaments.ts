import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getManagedTeams } from "@/lib/supabase/teams";
import type { Database, TournamentStatus } from "@/lib/supabase/database.types";

export type TournamentRow = Database["public"]["Tables"]["tournaments"]["Row"];
export type RegistrationRow = Database["public"]["Tables"]["tournament_registrations"]["Row"];

export type RegistrationEntry = RegistrationRow & {
  profile: { username: string; display_name: string; avatar_url: string | null } | null;
  team: { id: string; name: string; tag: string } | null;
};

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

export async function getRegistrations(tournamentId: string): Promise<RegistrationEntry[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("tournament_registrations")
    .select("*")
    .eq("tournament_id", tournamentId)
    .order("registered_at", { ascending: true });

  const registrations = rows ?? [];
  if (registrations.length === 0) return [];

  const userIds = registrations.filter((r) => r.user_id).map((r) => r.user_id as string);
  const teamIds = registrations.filter((r) => r.team_id).map((r) => r.team_id as string);

  const [{ data: profiles }, { data: teams }] = await Promise.all([
    userIds.length > 0
      ? supabase.from("profiles").select("id, username, display_name, avatar_url").in("id", userIds)
      : Promise.resolve({ data: [] }),
    teamIds.length > 0
      ? supabase.from("teams").select("id, name, tag").in("id", teamIds)
      : Promise.resolve({ data: [] }),
  ]);

  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));
  const teamById = new Map((teams ?? []).map((t) => [t.id, t]));

  return registrations.map((r) => ({
    ...r,
    profile: r.user_id ? (profileById.get(r.user_id) ?? null) : null,
    team: r.team_id ? (teamById.get(r.team_id) ?? null) : null,
  }));
}

/** Every entry the viewer has in this tournament — their solo entry, if
 * any, plus one per team they manage that's registered. Almost always 0
 * or 1 in practice. */
export async function getMyRegistrations(
  tournamentId: string,
  userId: string,
): Promise<RegistrationEntry[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createClient();
  const managedTeams = await getManagedTeams(userId);
  const teamIds = managedTeams.map((t) => t.id);

  let query = supabase
    .from("tournament_registrations")
    .select("*")
    .eq("tournament_id", tournamentId);

  query =
    teamIds.length > 0
      ? query.or(`user_id.eq.${userId},team_id.in.(${teamIds.join(",")})`)
      : query.eq("user_id", userId);

  const { data } = await query;
  const rows = data ?? [];
  const teamById = new Map(managedTeams.map((t) => [t.id, t]));

  return rows.map((r) => ({
    ...r,
    profile: null,
    team: r.team_id ? (teamById.get(r.team_id) ?? null) : null,
  }));
}
