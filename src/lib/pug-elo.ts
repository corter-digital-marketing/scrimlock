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
