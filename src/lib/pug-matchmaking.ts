/**
 * Pure matchmaking logic — no Supabase here, just data in / data out, so
 * it's easy to read and (eventually) unit test in isolation from the DB.
 *
 * Priority, per the brief: get a match found fast. A small early
 * community means the queue will rarely have more than 12 people in it
 * at all, so the FIFO path below *is* the common case. ELO-aware
 * selection only kicks in once there's an actual surplus to choose from.
 */

export const MATCH_SIZE = 12;
export const TEAM_SIZE = 6;
/** Simple majority of 12 — first side to reach this locks the result
 * immediately, no need to wait on stragglers. Lives here (not in the
 * server-only resolver) so client components can reference it too. */
export const VOTES_TO_CONFIRM = 7;
/** How long everyone has to check in once the lobby code is posted,
 * before the match auto-cancels (see tryExpireMatch). Also lives here,
 * client-safe, so the countdown UI can reference the same number. */
export const LOBBY_CHECKIN_WINDOW_MS = 5 * 60 * 1000;
const LOOKAHEAD_CAP = 30; // bound the selection search when the queue is large

export type QueueUnit = {
  id: string;
  leaderId: string;
  partyId: string | null;
  userIds: string[];
  size: number;
  elo: number;
  joinedAt: string;
};

export type TeamAssignment = {
  team1: QueueUnit[];
  team2: QueueUnit[];
};

/**
 * Picks the 12 players (as whole queue units — parties never split) that
 * should form the next match, or null if there aren't 12 available yet.
 * `queue` must already be filtered to one region, status 'queued', and
 * sorted oldest-first.
 */
export function selectMatchGroup(queue: QueueUnit[]): QueueUnit[] | null {
  const totalAvailable = queue.reduce((sum, u) => sum + u.size, 0);
  if (totalAvailable < MATCH_SIZE) return null;

  const pool = queue.slice(0, LOOKAHEAD_CAP);
  const allSolo = pool.every((u) => u.size === 1);

  if (allSolo && pool.length > MATCH_SIZE) {
    const byElo = eloWindowSelect(pool);
    if (byElo) return byElo;
  }

  return fifoFill(pool, MATCH_SIZE);
}

/** Oldest-first greedy fill, skipping any unit that would overshoot the
 * target — guarantees a fast match and trivially respects party sizes. */
function fifoFill(pool: QueueUnit[], target: number): QueueUnit[] | null {
  const selected: QueueUnit[] = [];
  let total = 0;
  for (const unit of pool) {
    if (total + unit.size > target) continue;
    selected.push(unit);
    total += unit.size;
    if (total === target) return selected;
  }
  return null;
}

/** Among solo queuers only: the ELO-tightest window of exactly `MATCH_SIZE`
 * that still includes whoever's waited longest, so nobody gets skipped
 * over indefinitely just because their rank is unusual. */
function eloWindowSelect(pool: QueueUnit[]): QueueUnit[] | null {
  const oldest = pool[0];
  const byElo = [...pool].sort((a, b) => a.elo - b.elo);

  let best: QueueUnit[] | null = null;
  let bestSpread = Infinity;
  for (let i = 0; i <= byElo.length - MATCH_SIZE; i++) {
    const window = byElo.slice(i, i + MATCH_SIZE);
    if (!window.some((u) => u.id === oldest.id)) continue;
    const spread = window[window.length - 1].elo - window[0].elo;
    if (spread < bestSpread) {
      bestSpread = spread;
      best = window;
    }
  }
  return best;
}

/**
 * Splits 12 selected units into two teams of 6. Units are placed
 * largest-first (first-fit-decreasing) so party sizes actually fit —
 * pure ELO-first ordering can deadlock (e.g. three parties of 4 can't
 * split evenly into two sixes) — then balanced onto whichever team has
 * the lower running ELO total, tie-broken by whichever has room.
 */
export function assignTeams(units: QueueUnit[]): TeamAssignment | null {
  const ordered = [...units].sort((a, b) => b.size - a.size || b.elo - a.elo);

  const team1: QueueUnit[] = [];
  const team2: QueueUnit[] = [];
  let size1 = 0;
  let size2 = 0;
  let elo1 = 0;
  let elo2 = 0;

  for (const unit of ordered) {
    const fits1 = size1 + unit.size <= TEAM_SIZE;
    const fits2 = size2 + unit.size <= TEAM_SIZE;
    const placeOn1 = fits1 && fits2 ? elo1 <= elo2 : fits1;

    if (!fits1 && !fits2) return null; // infeasible split — caller retries next tick

    if (placeOn1) {
      team1.push(unit);
      size1 += unit.size;
      elo1 += unit.elo * unit.size;
    } else {
      team2.push(unit);
      size2 += unit.size;
      elo2 += unit.elo * unit.size;
    }
  }

  return size1 === TEAM_SIZE && size2 === TEAM_SIZE ? { team1, team2 } : null;
}

export function averageElo(units: QueueUnit[]): number {
  const totalSize = units.reduce((sum, u) => sum + u.size, 0);
  const totalElo = units.reduce((sum, u) => sum + u.elo * u.size, 0);
  return totalSize === 0 ? 0 : totalElo / totalSize;
}

export function allUserIds(units: QueueUnit[]): string[] {
  return units.flatMap((u) => u.userIds);
}
