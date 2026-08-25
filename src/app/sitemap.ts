import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { getTournaments } from "@/lib/supabase/tournaments";
import { getTeams } from "@/lib/supabase/teams";

const STATIC_ROUTES: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  { path: "/", priority: 1, changeFrequency: "daily" },
  { path: "/pug", priority: 0.9, changeFrequency: "hourly" },
  { path: "/pug/leaderboard", priority: 0.6, changeFrequency: "daily" },
  { path: "/scrims", priority: 0.9, changeFrequency: "hourly" },
  { path: "/lft", priority: 0.9, changeFrequency: "hourly" },
  { path: "/tournaments", priority: 0.9, changeFrequency: "daily" },
  { path: "/teams", priority: 0.7, changeFrequency: "daily" },
];

// Regenerate at most once an hour — these are DB-backed and don't need to
// be computed on every crawler hit.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [tournaments, teams] = await Promise.all([
    getTournaments().catch(() => []),
    getTeams().catch(() => []),
  ]);

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: `${SITE_URL}${route.path}`,
    priority: route.priority,
    changeFrequency: route.changeFrequency,
  }));

  const tournamentEntries: MetadataRoute.Sitemap = tournaments.map((t) => ({
    url: `${SITE_URL}/tournaments/${t.id}`,
    lastModified: t.created_at,
    priority: 0.6,
    changeFrequency: "daily",
  }));

  const teamEntries: MetadataRoute.Sitemap = teams.map((t) => ({
    url: `${SITE_URL}/teams/${t.id}`,
    lastModified: t.created_at,
    priority: 0.5,
    changeFrequency: "weekly",
  }));

  return [...staticEntries, ...tournamentEntries, ...teamEntries];
}
