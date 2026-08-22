import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getTournaments } from "@/lib/supabase/tournaments";
import { TournamentCard } from "@/components/tournaments/tournament-card";
import { TournamentsFilterBar } from "@/components/tournaments/tournaments-filter-bar";
import { DecoDivider } from "@/components/site/deco-divider";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Region } from "@/lib/regions";
import type { TournamentStatus } from "@/lib/supabase/database.types";

export const metadata: Metadata = { title: "Tournaments" };
export const dynamic = "force-dynamic";

async function TournamentsList({
  region,
  status,
  minRank,
  maxRank,
}: {
  region?: Region;
  status?: TournamentStatus;
  minRank?: number;
  maxRank?: number;
}) {
  const tournaments = await getTournaments({
    region,
    status,
    minRankId: minRank,
    maxRankId: maxRank,
  });

  if (tournaments.length === 0) {
    return (
      <div className="frame-brass mt-6 rounded-sm bg-surface px-6 py-10 text-center">
        <p className="font-body text-parchment-dim">
          No tournaments match those filters yet.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {tournaments.map((tournament) => (
        <TournamentCard key={tournament.id} tournament={tournament} />
      ))}
    </div>
  );
}

export default async function TournamentsPage({
  searchParams,
}: {
  searchParams: Promise<{
    region?: string;
    status?: string;
    minRank?: string;
    maxRank?: string;
  }>;
}) {
  const params = await searchParams;
  const region = params.region as Region | undefined;
  const status = params.status as TournamentStatus | undefined;
  const minRank = params.minRank ? Number(params.minRank) : undefined;
  const maxRank = params.maxRank ? Number(params.maxRank) : undefined;

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-end sm:justify-between sm:text-left">
        <div>
          <p className="font-label text-xs tracking-[0.35em] text-verdigris uppercase">
            Compete
          </p>
          <h1 className="font-display mt-3 text-4xl text-parchment">
            Tournaments
          </h1>
        </div>
        <Link
          href="/tournaments/new"
          className={cn(
            buttonVariants(),
            "bg-brass text-primary-foreground hover:bg-brass/90",
          )}
        >
          Create a Tournament
        </Link>
      </div>

      <DecoDivider className="mt-8" />

      <div className="mt-8">
        <Suspense>
          <TournamentsFilterBar />
        </Suspense>
      </div>

      <Suspense
        fallback={
          <p className="font-body mt-6 text-center text-parchment-dim">
            Loading tournaments…
          </p>
        }
      >
        <TournamentsList region={region} status={status} minRank={minRank} maxRank={maxRank} />
      </Suspense>
    </div>
  );
}
