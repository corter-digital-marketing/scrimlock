import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Database } from "@/lib/supabase/database.types";
import { PUG_REGIONS, type PugRegion } from "@/lib/pug-regions";

export type PugMatchRow = Database["public"]["Tables"]["pug_matches"]["Row"];
export type PugMatchPlayerRow = Database["public"]["Tables"]["pug_match_players"]["Row"];
export type PugMatchVoteRow = Database["public"]["Tables"]["pug_match_votes"]["Row"];
export type PugQueueEntryRow = Database["public"]["Tables"]["pug_queue_entries"]["Row"];
export type PugMatchMessageRow = Database["public"]["Tables"]["pug_match_messages"]["Row"];

export type MatchPlayerEntry = PugMatchPlayerRow & {
  profile: { username: string; display_name: string; avatar_url: string | null } | null;
};

export type MatchMessageEntry = PugMatchMessageRow & {
  profile: { username: string; display_name: string; avatar_url: string | null } | null;
};

export async function getMatchById(id: string): Promise<PugMatchRow | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  const { data } = await supabase.from("pug_matches").select("*").eq("id", id).maybeSingle();
  return data ?? null;
}

export async function getMatchPlayers(matchId: string): Promise<MatchPlayerEntry[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createClient();
  const { data: players } = await supabase
    .from("pug_match_players")
    .select("*")
    .eq("match_id", matchId);

  const rows = players ?? [];
  if (rows.length === 0) return [];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url")
    .in(
      "id",
      rows.map((r) => r.user_id),
    );
  const byId = new Map((profiles ?? []).map((p) => [p.id, p]));

  return rows.map((r) => ({ ...r, profile: byId.get(r.user_id) ?? null }));
}

export async function getMatchVotes(matchId: string): Promise<PugMatchVoteRow[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createClient();
  const { data } = await supabase.from("pug_match_votes").select("*").eq("match_id", matchId);
  return data ?? [];
}

export async function getMatchMessages(matchId: string): Promise<MatchMessageEntry[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createClient();
  const { data: messages } = await supabase
    .from("pug_match_messages")
    .select("*")
    .eq("match_id", matchId)
    .order("created_at", { ascending: true });

  const rows = messages ?? [];
  if (rows.length === 0) return [];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url")
    .in(
      "id",
      rows.map((r) => r.sender_id),
    );
  const byId = new Map((profiles ?? []).map((p) => [p.id, p]));

  return rows.map((r) => ({ ...r, profile: byId.get(r.sender_id) ?? null }));
}

/** An unresolved match (not yet completed *or* cancelled) the user is
 * currently part of — /pug redirects here so someone can't queue into a
 * second match while still in one. A cancelled match doesn't count:
 * this was missed when 'cancelled' was added as a status, and it sent
 * anyone whose match got cancelled straight back to it every time they
 * tried to leave, with no way back to the queue screen. */
export async function getMyActiveMatch(userId: string): Promise<PugMatchRow | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  const { data: playerRows } = await supabase
    .from("pug_match_players")
    .select("match_id")
    .eq("user_id", userId);

  const matchIds = (playerRows ?? []).map((r) => r.match_id);
  if (matchIds.length === 0) return null;

  const { data } = await supabase
    .from("pug_matches")
    .select("*")
    .in("id", matchIds)
    .in("status", ["lobby_pending", "in_progress"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data ?? null;
}

export async function getMyQueueEntry(userId: string): Promise<PugQueueEntryRow | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("pug_queue_entries")
    .select("*")
    .eq("leader_id", userId)
    .eq("status", "queued")
    .maybeSingle();

  return data ?? null;
}

export async function getQueueCount(region: string): Promise<number> {
  if (!isSupabaseConfigured()) return 0;

  const supabase = await createClient();
  const { data } = await supabase
    .from("pug_queue_entries")
    .select("size")
    .eq("region", region)
    .eq("status", "queued");

  return (data ?? []).reduce((sum, r) => sum + r.size, 0);
}

/** Live head count for every PUG region at once — lets the queue screen
 * show both pools up front so players can pick whichever's warmer. */
export async function getQueueCounts(): Promise<Record<PugRegion, number>> {
  const empty = Object.fromEntries(PUG_REGIONS.map((r) => [r, 0])) as Record<PugRegion, number>;
  if (!isSupabaseConfigured()) return empty;

  const supabase = await createClient();
  const { data } = await supabase
    .from("pug_queue_entries")
    .select("region, size")
    .in("region", PUG_REGIONS)
    .eq("status", "queued");

  const counts = { ...empty };
  for (const row of data ?? []) {
    if (row.region === "NA" || row.region === "EU") counts[row.region] += row.size;
  }
  return counts;
}
