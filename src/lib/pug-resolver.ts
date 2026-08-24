import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import { eloDelta, applyEloDelta } from "@/lib/pug-elo";
import { VOTES_TO_CONFIRM, LOBBY_CHECKIN_WINDOW_MS } from "@/lib/pug-matchmaking";

/**
 * Checks whether either side has enough votes yet and, if so, applies
 * ELO to all 12 players and marks the match completed. Safe to call
 * after every vote — it's a no-op once the match is already resolved.
 * Service-role: applying ELO writes to 12 different profiles' rows.
 */
export async function tryResolveMatch(matchId: string): Promise<void> {
  const supabase = createServiceClient();

  const { data: match } = await supabase
    .from("pug_matches")
    .select("status")
    .eq("id", matchId)
    .maybeSingle();
  if (!match || match.status === "completed") return;

  const { data: votes } = await supabase
    .from("pug_match_votes")
    .select("voted_team")
    .eq("match_id", matchId);

  const team1Votes = (votes ?? []).filter((v) => v.voted_team === 1).length;
  const team2Votes = (votes ?? []).filter((v) => v.voted_team === 2).length;

  const winningTeam =
    team1Votes >= VOTES_TO_CONFIRM ? 1 : team2Votes >= VOTES_TO_CONFIRM ? 2 : null;
  if (!winningTeam) return;

  const { data: players } = await supabase
    .from("pug_match_players")
    .select("*")
    .eq("match_id", matchId);
  if (!players || players.length === 0) return;

  const team1 = players.filter((p) => p.team === 1);
  const team2 = players.filter((p) => p.team === 2);
  const avg = (list: typeof players) =>
    list.reduce((sum, p) => sum + p.elo_before, 0) / list.length;
  const avg1 = avg(team1);
  const avg2 = avg(team2);

  for (const p of players) {
    const won = p.team === winningTeam;
    const opponentAvg = p.team === 1 ? avg2 : avg1;
    const delta = eloDelta(p.elo_before, opponentAvg, won);
    const newElo = applyEloDelta(p.elo_before, delta);

    await supabase.from("pug_match_players").update({ elo_after: newElo }).eq("id", p.id);
    await supabase.from("profiles").update({ pug_elo: newElo }).eq("id", p.user_id);
  }

  await supabase
    .from("pug_matches")
    .update({
      status: "completed",
      winning_team: winningTeam,
      completed_at: new Date().toISOString(),
    })
    .eq("id", matchId);
}

/**
 * Cancels a match if the check-in window has passed with someone still
 * not checked in. Opportunistic, same as tryFormMatch/tryResolveMatch —
 * called from the match page on load, since there's no background job
 * runner. Service-role: reading everyone's checked_in_at and writing
 * match status isn't any one player's call to make.
 */
export async function tryExpireMatch(matchId: string): Promise<void> {
  const supabase = createServiceClient();

  const { data: match } = await supabase
    .from("pug_matches")
    .select("status, lobby_opened_at")
    .eq("id", matchId)
    .maybeSingle();
  if (!match || match.status !== "in_progress" || !match.lobby_opened_at) return;

  const deadline = new Date(match.lobby_opened_at).getTime() + LOBBY_CHECKIN_WINDOW_MS;
  if (Date.now() < deadline) return;

  const { data: players } = await supabase
    .from("pug_match_players")
    .select("checked_in_at")
    .eq("match_id", matchId);
  const allCheckedIn = (players ?? []).length > 0 && (players ?? []).every((p) => p.checked_in_at);
  if (allCheckedIn) return;

  await supabase.from("pug_matches").update({ status: "cancelled" }).eq("id", matchId);
}
