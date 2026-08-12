export type NavLink = {
  href: string;
  label: string;
  /** Small in-world flavor label shown under the plain label on wide screens. */
  flavor?: string;
};

/**
 * The three primary tabs — hard requirement (§4): Tournaments, Scrims, and LFT
 * must be separate, equally-weighted top-level nav items.
 */
export const primaryNavLinks: NavLink[] = [
  { href: "/tournaments", label: "Tournaments", flavor: "The Bill" },
  { href: "/scrims", label: "Scrims", flavor: "Arrangements" },
  { href: "/lft", label: "LFT", flavor: "Notices" },
];

/** Secondary nav — teams live in the nav per §4, profile lives in the user menu. */
export const secondaryNavLinks: NavLink[] = [
  { href: "/teams", label: "Teams", flavor: "Syndicates" },
];
