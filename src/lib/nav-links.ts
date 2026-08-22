export type NavLink = {
  href: string;
  label: string;
};

/**
 * Tournaments, Scrims, and LFT are a hard requirement (§4): separate,
 * equally-weighted top-level nav items. PUG leads the list — it's the
 * main feature (fast, ELO-matched 6v6 queue), so it gets first billing.
 */
export const primaryNavLinks: NavLink[] = [
  { href: "/pug", label: "PUG" },
  { href: "/tournaments", label: "Tournaments" },
  { href: "/scrims", label: "Scrims" },
  { href: "/lft", label: "LFT" },
];

/** Secondary nav — teams live in the nav per §4, profile lives in the user menu. */
export const secondaryNavLinks: NavLink[] = [{ href: "/teams", label: "Teams" }];
