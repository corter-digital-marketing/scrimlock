/**
 * PUG queueing uses its own, deliberately small region list — separate
 * from the site-wide `REGIONS` (§3) used by Teams/Scrims/Tournaments/
 * Profiles/LFT. A young playerbase splitting across 8 regions is exactly
 * how a "match as fast as possible" queue starves itself; two pools is
 * the whole point. Widen this later if population ever demands it.
 */
export const PUG_REGIONS = ["NA", "EU"] as const;

export type PugRegion = (typeof PUG_REGIONS)[number];

export const PUG_REGION_LABELS: Record<PugRegion, string> = {
  NA: "North America",
  EU: "Europe",
};

export function isPugRegion(value: unknown): value is PugRegion {
  return value === "NA" || value === "EU";
}
