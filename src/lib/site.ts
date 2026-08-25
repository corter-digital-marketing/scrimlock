/**
 * Single source of truth for the site's canonical URL, name, and default
 * blurb — reused by root metadata, robots.ts, sitemap.ts, JSON-LD, and
 * the dynamic OG image so they can't drift out of sync with each other.
 *
 * NEXT_PUBLIC_SITE_URL overrides this — set it in Vercel's Preview
 * environment (to that deployment's own vercel.app URL) if preview
 * builds should self-reference instead of pointing at production.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://scrimlock.com"
).replace(/\/$/, "");

export const SITE_NAME = "ScrimLock";

export const SITE_DESCRIPTION =
  "ScrimLock is the competitive hub for Valve's Deadlock: queue Deadlock PUGs, arrange scrims, enter tournaments, and find your team on the Deadlock LFT board.";
