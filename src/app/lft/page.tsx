import type { Metadata } from "next";
import { Suspense } from "react";
import { getLftPlayers } from "@/lib/supabase/lft";
import { getActiveHeroes } from "@/lib/supabase/heroes";
import { getTeams, getActiveMemberCounts } from "@/lib/supabase/teams";
import { LftFilterBar } from "@/components/lft/lft-filter-bar";
import { PlayerCard } from "@/components/lft/player-card";
import { TeamCard } from "@/components/teams/team-card";
import type { Region } from "@/lib/regions";

export const metadata: Metadata = {
  title: "Deadlock LFT — Looking for Team",
  description:
    "Browse Deadlock players looking for a team and teams looking for players. Filter by region, rank, and hero pool to find your next roster spot.",
};
export const dynamic = "force-dynamic";

async function PlayersView({
  region,
  minRank,
  maxRank,
  hero,
  heroes,
}: {
  region?: Region;
  minRank?: number;
  maxRank?: number;
  hero?: string;
  heroes: Awaited<ReturnType<typeof getActiveHeroes>>;
}) {
  const players = await getLftPlayers({
    region,
    minRankId: minRank,
    maxRankId: maxRank,
    heroId: hero,
  });
  const heroesById = new Map(heroes.map((h) => [h.id, h]));

  if (players.length === 0) {
    return (
      <div className="frame-brass mt-6 rounded-sm bg-surface px-6 py-10 text-center">
        <p className="font-body text-parchment-dim">
          No players match those filters yet.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {players.map((profile) => (
        <PlayerCard key={profile.id} profile={profile} heroesById={heroesById} />
      ))}
    </div>
  );
}

async function TeamsView({ region }: { region?: Region }) {
  const teams = await getTeams({ region, recruitingOnly: true });
  const counts = await getActiveMemberCounts(teams.map((t) => t.id));

  if (teams.length === 0) {
    return (
      <div className="frame-brass mt-6 rounded-sm bg-surface px-6 py-10 text-center">
        <p className="font-body text-parchment-dim">
          No teams are recruiting with those filters yet.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {teams.map((team) => (
        <TeamCard key={team.id} team={team} memberCount={counts[team.id] ?? 0} />
      ))}
    </div>
  );
}

export default async function LftPage({
  searchParams,
}: {
  searchParams: Promise<{
    view?: string;
    region?: string;
    minRank?: string;
    maxRank?: string;
    hero?: string;
  }>;
}) {
  const params = await searchParams;
  const view = params.view === "teams" ? "teams" : "players";
  const region = params.region as Region | undefined;
  const minRank = params.minRank ? Number(params.minRank) : undefined;
  const maxRank = params.maxRank ? Number(params.maxRank) : undefined;
  const hero = params.hero;
  const heroes = await getActiveHeroes();

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="text-center">
        <p className="font-label text-xs tracking-[0.35em] text-verdigris uppercase">
          Notices
        </p>
        <h1 className="font-display mt-3 text-4xl text-parchment">
          Looking For Team
        </h1>
        <p className="font-body mx-auto mt-4 max-w-xl text-parchment-dim">
          Players advertise rank, preferred heroes, and region. Teams post
          open slots. No rigid roles — just what you play.
        </p>
      </div>

      <div className="mt-8">
        <Suspense>
          <LftFilterBar heroes={heroes} />
        </Suspense>
      </div>

      <Suspense
        fallback={
          <p className="font-body mt-6 text-center text-parchment-dim">
            Loading…
          </p>
        }
      >
        {view === "players" ? (
          <PlayersView
            region={region}
            minRank={minRank}
            maxRank={maxRank}
            hero={hero}
            heroes={heroes}
          />
        ) : (
          <TeamsView region={region} />
        )}
      </Suspense>
    </div>
  );
}
