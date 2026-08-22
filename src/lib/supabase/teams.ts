import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Database, TeamRole } from "@/lib/supabase/database.types";

export type TeamRow = Database["public"]["Tables"]["teams"]["Row"];
export type TeamMemberRow = Database["public"]["Tables"]["team_members"]["Row"];

export type RosterEntry = TeamMemberRow & {
  profile: {
    username: string;
    display_name: string;
    avatar_url: string | null;
    rank_id: number | null;
    rank_subrank: number | null;
  } | null;
};

const ROLE_ORDER: Record<TeamRole, number> = {
  owner: 0,
  captain: 1,
  player: 2,
  sub: 3,
};

/** Attaches each member's profile with two queries instead of an embedded
 * join — simpler to keep correct in a hand-maintained Database type than
 * relying on PostgREST relationship inference. */
async function withProfiles(
  supabase: Awaited<ReturnType<typeof createClient>>,
  members: TeamMemberRow[],
): Promise<RosterEntry[]> {
  if (members.length === 0) return [];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url, rank_id, rank_subrank")
    .in(
      "id",
      members.map((m) => m.user_id),
    );

  const byId = new Map((profiles ?? []).map((p) => [p.id, p]));

  return members.map((m) => ({ ...m, profile: byId.get(m.user_id) ?? null }));
}

export async function getTeams(filters?: {
  region?: string;
  recruitingOnly?: boolean;
}): Promise<TeamRow[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createClient();
  let query = supabase.from("teams").select("*").order("created_at", { ascending: false });

  if (filters?.region) query = query.eq("region", filters.region);
  if (filters?.recruitingOnly) query = query.eq("is_recruiting", true);

  const { data } = await query;
  return data ?? [];
}

export async function getTeamById(id: string): Promise<TeamRow | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  const { data } = await supabase.from("teams").select("*").eq("id", id).maybeSingle();
  return data ?? null;
}

export async function getTeamRoster(teamId: string): Promise<RosterEntry[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("team_members")
    .select("*")
    .eq("team_id", teamId)
    .eq("status", "active");

  const members = (data ?? []).slice().sort((a, b) => {
    const roleDiff = ROLE_ORDER[a.role_on_team] - ROLE_ORDER[b.role_on_team];
    return roleDiff !== 0 ? roleDiff : a.joined_at.localeCompare(b.joined_at);
  });

  return withProfiles(supabase, members);
}

export async function getPendingRequests(teamId: string): Promise<RosterEntry[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("team_members")
    .select("*")
    .eq("team_id", teamId)
    .eq("status", "pending")
    .order("joined_at", { ascending: true });

  return withProfiles(supabase, data ?? []);
}

export async function getMembership(
  teamId: string,
  userId: string,
): Promise<TeamMemberRow | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("team_members")
    .select("*")
    .eq("team_id", teamId)
    .eq("user_id", userId)
    .maybeSingle();

  return data ?? null;
}

export function canManage(role: TeamRole | undefined) {
  return role === "owner" || role === "captain";
}

/** Teams the user owns or captains — for "post/respond as your team" pickers. */
export async function getManagedTeams(userId: string): Promise<TeamRow[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createClient();
  const { data: memberships } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("user_id", userId)
    .eq("status", "active")
    .in("role_on_team", ["owner", "captain"]);

  const teamIds = (memberships ?? []).map((m) => m.team_id);
  if (teamIds.length === 0) return [];

  const { data } = await supabase.from("teams").select("*").in("id", teamIds);
  return data ?? [];
}

/** One grouped query instead of one count-query per team on the browse page. */
export async function getActiveMemberCounts(
  teamIds: string[],
): Promise<Record<string, number>> {
  if (!isSupabaseConfigured() || teamIds.length === 0) return {};

  const supabase = await createClient();
  const { data } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("status", "active")
    .in("team_id", teamIds);

  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    counts[row.team_id] = (counts[row.team_id] ?? 0) + 1;
  }
  return counts;
}
