import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { ProfileRow } from "@/lib/supabase/profiles";

export type LeaderboardEntry = {
  profile: ProfileRow;
  matchesPlayed: number;
};

/**
 * Top PUG players by ELO. Only players who've actually finished a match
 * are eligible — everyone else is tied at the 0 starting ELO, which
 * isn't a ranking, just alphabetical noise.
 *
 * `pug_match_players.elo_after` is null until a match resolves, so it
 * doubles as "did this row come from a completed match" without a join
 * to pug_matches — useful, because pug_matches' own RLS only lets a
 * player read matches *they* were in, not every match site-wide (by
 * design — the row also carries the lobby code). Staying on
 * pug_match_players (public read) keeps this a real global leaderboard.
 */
export async function getPugLeaderboard(limit = 50): Promise<LeaderboardEntry[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createClient();

  const { data: finishedRows } = await supabase
    .from("pug_match_players")
    .select("user_id")
    .not("elo_after", "is", null);

  const matchCounts = new Map<string, number>();
  for (const row of finishedRows ?? []) {
    matchCounts.set(row.user_id, (matchCounts.get(row.user_id) ?? 0) + 1);
  }

  const eligibleIds = [...matchCounts.keys()];
  if (eligibleIds.length === 0) return [];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .in("id", eligibleIds)
    .order("pug_elo", { ascending: false })
    .limit(limit);

  return (profiles ?? []).map((profile) => ({
    profile,
    matchesPlayed: matchCounts.get(profile.id) ?? 0,
  }));
}
