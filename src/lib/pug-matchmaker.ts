import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import {
  selectMatchGroup,
  assignTeams,
  allUserIds,
  type QueueUnit,
} from "@/lib/pug-matchmaking";

/**
 * Tries to form a match in `region` from whoever's currently queued.
 * Runs on the service-role client because it has to read and write other
 * players' rows, not just the caller's own — this is the one place in
 * the app that's true of. Returns the new match id if one formed, else
 * null (not enough players yet, or lost a race to another concurrent
 * attempt — both are fine, the caller just tries again later).
 *
 * Called opportunistically: whenever someone joins/leaves the queue, and
 * from the /pug page itself on each load, since there's no background
 * job runner to trigger this on a timer.
 */
export async function tryFormMatch(region: string): Promise<string | null> {
  const supabase = createServiceClient();

  const { data: entries } = await supabase
    .from("pug_queue_entries")
    .select("*")
    .eq("region", region)
    .eq("status", "queued")
    .order("joined_at", { ascending: true });

  const queue: QueueUnit[] = (entries ?? []).map((e) => ({
    id: e.id,
    leaderId: e.leader_id,
    partyId: e.party_id,
    userIds: e.user_ids,
    size: e.size,
    elo: e.elo,
    joinedAt: e.joined_at,
  }));

  const selected = selectMatchGroup(queue);
  if (!selected) return null;

  const teams = assignTeams(selected);
  if (!teams) return null;

  const allIds = allUserIds([...teams.team1, ...teams.team2]);

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, pug_elo")
    .in("id", allIds);
  const eloById = new Map((profiles ?? []).map((p) => [p.id, p.pug_elo]));

  const lobbyMaker = allIds.reduce((best, id) =>
    (eloById.get(id) ?? 0) > (eloById.get(best) ?? 0) ? id : best,
  );

  // Atomic claim: only entries still 'queued' get flipped. If a concurrent
  // call already grabbed one of these, we get back fewer rows than we
  // asked for — release whatever we did grab and bail, no partial matches.
  const entryIds = selected.map((u) => u.id);
  const { data: claimed } = await supabase
    .from("pug_queue_entries")
    .update({ status: "matched" })
    .in("id", entryIds)
    .eq("status", "queued")
    .select("id");

  if (!claimed || claimed.length !== entryIds.length) {
    if (claimed && claimed.length > 0) {
      await supabase
        .from("pug_queue_entries")
        .update({ status: "queued" })
        .in(
          "id",
          claimed.map((c) => c.id),
        );
    }
    return null;
  }

  const { data: match, error: matchError } = await supabase
    .from("pug_matches")
    .insert({ region, lobby_maker_id: lobbyMaker })
    .select("id")
    .single();

  if (matchError || !match) {
    // Couldn't create the match — release the claimed entries so they're
    // not stranded as 'matched' with nothing to point to.
    await supabase.from("pug_queue_entries").update({ status: "queued" }).in("id", entryIds);
    return null;
  }

  const playerRows = [
    ...teams.team1.flatMap((u) =>
      u.userIds.map((userId) => ({
        match_id: match.id,
        user_id: userId,
        team: 1,
        elo_before: eloById.get(userId) ?? 0,
      })),
    ),
    ...teams.team2.flatMap((u) =>
      u.userIds.map((userId) => ({
        match_id: match.id,
        user_id: userId,
        team: 2,
        elo_before: eloById.get(userId) ?? 0,
      })),
    ),
  ];

  await supabase.from("pug_match_players").insert(playerRows);
  await supabase
    .from("pug_queue_entries")
    .update({ matched_into: match.id })
    .in("id", entryIds);

  return match.id;
}
