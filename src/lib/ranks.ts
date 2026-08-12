/**
 * Deadlock's ranked ladder, low → high (post July 30 2026 rename).
 *
 * The `ranks` Postgres table (supabase/migrations) is the source of truth
 * for anything relational (filters, FKs, rank-range queries). This constant
 * mirrors it 1:1 so client UI (badges, static pickers) doesn't need a round
 * trip just to render a name — keep the two in sync if the ladder changes.
 *
 * `icon` paths point at `public/ranks/` — the official rank emblems
 * (`initiate.webp` is filed under Valve's older name for it, "Brick").
 */
export const RANKS = [
  { id: 0, name: "Obscurus", isPlacement: true, icon: "/ranks/obscurus.webp" },
  { id: 1, name: "Initiate", isPlacement: false, icon: "/ranks/initiate.webp" },
  { id: 2, name: "Seeker", isPlacement: false, icon: "/ranks/seeker.webp" },
  { id: 3, name: "Acolyte", isPlacement: false, icon: "/ranks/acolyte.webp" },
  { id: 4, name: "Sentinel", isPlacement: false, icon: "/ranks/sentinel.webp" },
  { id: 5, name: "Mystic", isPlacement: false, icon: "/ranks/mystic.webp" },
  { id: 6, name: "Ritualist", isPlacement: false, icon: "/ranks/ritualist.webp" },
  { id: 7, name: "Emissary", isPlacement: false, icon: "/ranks/emissary.webp" },
  { id: 8, name: "Oracle", isPlacement: false, icon: "/ranks/oracle.webp" },
  { id: 9, name: "Phantom", isPlacement: false, icon: "/ranks/phantom.webp" },
  { id: 10, name: "Ascendant", isPlacement: false, icon: "/ranks/ascendant.webp" },
  { id: 11, name: "Eternus", isPlacement: false, icon: "/ranks/eternus.webp" },
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
