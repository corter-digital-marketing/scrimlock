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
 * PUG's own letter-grade ladder — deliberately separate from the
 * self-reported Deadlock rank (RANKS in lib/ranks.ts): this measures
 * PUG results specifically, not in-game skill, so it gets its own
 * simple S/A/B/C/D scale rather than borrowing Deadlock's 12-tier
 * ladder. 500 ELO per letter (~5 clean wins) — Unranked is the literal
 * starting point (0 ELO, nobody's played a match yet or they're net
 * even), S opens up at 2500 and climbs from there.
 */
export const PUG_LETTER_RANKS = [
  { letter: "Unranked", minElo: 0, color: "#8f8570" },
  { letter: "D", minElo: 500, color: "#b89b3f" },
  { letter: "C", minElo: 1000, color: "#4d7c4a" },
  { letter: "B", minElo: 1500, color: "#4a728f" },
  { letter: "A", minElo: 2000, color: "#c9a35c" },
  { letter: "S", minElo: 2500, color: "#a83232" },
] as const;

export type PugLetterRank = (typeof PUG_LETTER_RANKS)[number];

export function pugEloToLetterRank(elo: number): PugLetterRank {
  let result: PugLetterRank = PUG_LETTER_RANKS[0];
  for (const tier of PUG_LETTER_RANKS) {
    if (elo >= tier.minElo) result = tier;
  }
  return result;
}
