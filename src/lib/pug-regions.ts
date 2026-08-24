/**
 * PUG's region list used to be its own, deliberately smaller NA/EU
 * pair, kept separate from the site-wide `REGIONS` (§3) used by Teams/
 * Scrims/Tournaments/Profiles/LFT — that list had 8 regions at the
 * time. Now that the site-wide list has also been trimmed to NA/EU for
 * the beta, the two are identical, so this just re-exports it under
 * PUG's own names rather than maintaining a duplicate list that could
 * drift out of sync. If the site-wide list widens again later but PUG
 * should stay NA/EU-only (still the highest-value split for "match as
 * fast as possible"), swap this back to its own literal list.
 */
import { REGIONS, type Region } from "@/lib/regions";

export const PUG_REGIONS = REGIONS;

export type PugRegion = Region;

export const PUG_REGION_LABELS: Record<PugRegion, string> = {
  NA: "North America",
  EU: "Europe",
};

export function isPugRegion(value: unknown): value is PugRegion {
  return value === "NA" || value === "EU";
}
