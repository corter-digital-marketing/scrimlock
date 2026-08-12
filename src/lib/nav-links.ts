export type NavLink = {
  href: string;
  label: string;
};

/**
 * The three primary tabs — hard requirement (§4): Tournaments, Scrims, and LFT
 * must be separate, equally-weighted top-level nav items.
 */
export const primaryNavLinks: NavLink[] = [
  { href: "/tournaments", label: "Tournaments" },
  { href: "/scrims", label: "Scrims" },
  { href: "/lft", label: "LFT" },
];

/** Secondary nav — teams live in the nav per §4, profile lives in the user menu. */
export const secondaryNavLinks: NavLink[] = [{ href: "/teams", label: "Teams" }];
