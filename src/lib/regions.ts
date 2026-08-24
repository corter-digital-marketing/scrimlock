/**
 * App-level constant (§3) — not a DB table, regions don't change often.
 * Trimmed to NA/EU for the beta: an early, small playerbase splitting
 * across 8 regions just means every list (teams, scrims, tournaments,
 * LFT) looks emptier than it is. Widen this later once population
 * actually demands more regions. This is also exactly the PUG queue's
 * region list now — see pug-regions.ts, which re-exports these under
 * its own names rather than duplicating the list.
 */
export const REGIONS = ["NA", "EU"] as const;

export type Region = (typeof REGIONS)[number];
