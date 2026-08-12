/** App-level constant (§3) — not a DB table, regions don't change often. */
export const REGIONS = [
  "NA East",
  "NA West",
  "EU",
  "SA",
  "SEA",
  "East Asia",
  "Oceania",
  "Middle East",
] as const;

export type Region = (typeof REGIONS)[number];
