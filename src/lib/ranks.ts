/**
 * Deadlock's ranked ladder, low → high (post July 30 2026 rename).
 *
 * The `ranks` Postgres table (supabase/migrations) is the source of truth
 * for anything relational (filters, FKs, rank-range queries). This constant
 * mirrors it 1:1 so client UI (badges, static pickers) doesn't need a round
 * trip just to render a name — keep the two in sync if the ladder changes.
 */
export const RANKS = [
  { id: 0, name: "Obscurus", isPlacement: true },
  { id: 1, name: "Initiate", isPlacement: false },
  { id: 2, name: "Seeker", isPlacement: false },
  { id: 3, name: "Acolyte", isPlacement: false },
  { id: 4, name: "Sentinel", isPlacement: false },
  { id: 5, name: "Mystic", isPlacement: false },
  { id: 6, name: "Ritualist", isPlacement: false },
  { id: 7, name: "Emissary", isPlacement: false },
  { id: 8, name: "Oracle", isPlacement: false },
  { id: 9, name: "Phantom", isPlacement: false },
  { id: 10, name: "Ascendant", isPlacement: false },
  { id: 11, name: "Eternus", isPlacement: false },
] as const;

export type RankId = (typeof RANKS)[number]["id"];

const ROMAN_NUMERALS = ["I", "II", "III", "IV", "V", "VI"];

/** Subranks run 1–6 (roman numeral I–VI); Obscurus has none. */
export function subrankToRoman(subrank: number | null | undefined) {
  if (!subrank || subrank < 1 || subrank > 6) return null;
  return ROMAN_NUMERALS[subrank - 1];
}

export function getRankById(id: number | null | undefined) {
  return RANKS.find((r) => r.id === id) ?? null;
}
