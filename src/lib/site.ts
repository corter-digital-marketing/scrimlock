/**
 * Single source of truth for the site's canonical URL, name, and default
 * blurb — reused by root metadata, robots.ts, sitemap.ts, JSON-LD, and
 * the dynamic OG image so they can't drift out of sync with each other.
 *
 * Set NEXT_PUBLIC_SITE_URL in Vercel once a custom domain is attached
 * (e.g. https://scrimlock.gg) — everything here picks it up automatically.
 * Until then it falls back to the Vercel deployment URL.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://scrimlock.vercel.app"
).replace(/\/$/, "");

export const SITE_NAME = "ScrimLock";

export const SITE_DESCRIPTION =
  "ScrimLock is the competitive hub for Valve's Deadlock: queue Deadlock PUGs, arrange scrims, enter tournaments, and find your team on the Deadlock LFT board.";
