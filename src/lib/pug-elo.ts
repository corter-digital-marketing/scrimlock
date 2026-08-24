/**
 * Real ELO, tuned so an even match (50/50 expected) nets exactly the
 * numbers from the brief: +100 for a win, -70 for a loss. Different
 * K-factors for win vs loss is what makes that work — K_WIN * 0.5 = 100,
 * K_LOSS * 0.5 = 70 — while still scaling with how surprising the result
 * was (upset wins pay close to the full K; expected wins pay little).
 */
export const K_WIN = 200;
export const K_LOSS = 140;

export function expectedScore(myElo: number, opponentAvgElo: number): number {
  return 1 / (1 + Math.pow(10, (opponentAvgElo - myElo) / 400));
}

export function eloDelta(myElo: number, opponentAvgElo: number, won: boolean): number {
  const expected = expectedScore(myElo, opponentAvgElo);
  const actual = won ? 1 : 0;
  const k = won ? K_WIN : K_LOSS;
  return Math.round(k * (actual - expected));
}

/** ELO never goes negative — "you start at 0." */
export function applyEloDelta(currentElo: number, delta: number): number {
  return Math.max(0, currentElo + delta);
}

/**
 * PUG ELO shown as the same rank ladder as everywhere else on the site
 * (RANKS in lib/ranks.ts — Obscurus through Eternus, subranks I–VI),
 * instead of a bare number nobody has context for. 100 ELO per
 * subrank, 600 per rank — a clean win (+100) is roughly one subrank —
 * so Eternus VI opens up at 6100 ELO and just keeps climbing from
 * there. Below 100 is Obscurus (rank 0), which has no subranks, same
 * as the self-reported game rank.
 */
export const PUG_ELO_PER_SUBRANK = 100;
const SUBRANKS_PER_RANK = 6;
const MAX_RANK_ID = 11; // Eternus
const MAX_STEP = (MAX_RANK_ID - 1 + 1) * SUBRANKS_PER_RANK; // 66 — caps at Eternus VI

export function pugEloToRank(elo: number): { rankId: number; subrank: number | null } {
  if (elo < PUG_ELO_PER_SUBRANK) return { rankId: 0, subrank: null };

  const step = Math.min(MAX_STEP, Math.floor(elo / PUG_ELO_PER_SUBRANK));
  const rankId = Math.floor((step - 1) / SUBRANKS_PER_RANK) + 1;
  const subrank = ((step - 1) % SUBRANKS_PER_RANK) + 1;
  return { rankId, subrank };
}

/** The ELO a rank+subrank first opens up at — inverse of pugEloToRank,
 * mainly for showing "X ELO to next rank" type hints. */
export function eloForPugRank(rankId: number, subrank: number | null): number {
  if (rankId <= 0) return 0;
  const step = (rankId - 1) * SUBRANKS_PER_RANK + (subrank ?? 1);
  return step * PUG_ELO_PER_SUBRANK;
}
