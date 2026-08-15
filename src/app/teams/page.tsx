import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getTeams, getActiveMemberCounts } from "@/lib/supabase/teams";
import { TeamCard } from "@/components/teams/team-card";
import { TeamsFilterBar } from "@/components/teams/teams-filter-bar";
import { DecoDivider } from "@/components/site/deco-divider";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Region } from "@/lib/regions";

export const metadata: Metadata = { title: "Teams" };

async function TeamsList({
  region,
  recruitingOnly,
}: {
  region?: Region;
  recruitingOnly: boolean;
}) {
  const teams = await getTeams({ region, recruitingOnly });
  const counts = await getActiveMemberCounts(teams.map((t) => t.id));

  if (teams.length === 0) {
    return (
      <div className="frame-brass mt-6 rounded-sm bg-surface px-6 py-10 text-center">
        <p className="font-body text-parchment-dim">
          No teams match those filters yet.
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

export default async function TeamsPage({
  searchParams,
}: {
  searchParams: Promise<{ region?: string; recruiting?: string }>;
}) {
  const params = await searchParams;
  const region = params.region as Region | undefined;
  const recruitingOnly = params.recruiting === "1";

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-end sm:justify-between sm:text-left">
        <div>
          <p className="font-label text-xs tracking-[0.35em] text-verdigris uppercase">
            Syndicates
          </p>
          <h1 className="font-display mt-3 text-4xl text-parchment">Teams</h1>
        </div>
        <Link
          href="/teams/new"
          className={cn(
            buttonVariants(),
            "bg-brass text-primary-foreground hover:bg-brass/90",
          )}
        >
          Create a Team
        </Link>
      </div>

      <DecoDivider className="mt-8" />

      <div className="mt-8">
        <Suspense>
          <TeamsFilterBar />
        </Suspense>
      </div>

      <Suspense
        fallback={
          <p className="font-body mt-6 text-center text-parchment-dim">
            Loading teams…
          </p>
        }
      >
        <TeamsList region={region} recruitingOnly={recruitingOnly} />
      </Suspense>
    </div>
  );
}
