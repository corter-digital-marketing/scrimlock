import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getScrims } from "@/lib/supabase/scrims";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { ScrimCard } from "@/components/scrims/scrim-card";
import { ScrimsFilterBar } from "@/components/scrims/scrims-filter-bar";
import { DecoDivider } from "@/components/site/deco-divider";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Region } from "@/lib/regions";

export const metadata: Metadata = { title: "Scrims" };
export const dynamic = "force-dynamic";

async function ScrimsList({
  region,
  minRank,
  maxRank,
  after,
}: {
  region?: Region;
  minRank?: number;
  maxRank?: number;
  after?: string;
}) {
  const scrims = await getScrims({
    region,
    minRankId: minRank,
    maxRankId: maxRank,
    afterDate: after,
  });

  if (scrims.length === 0) {
    return (
      <div className="frame-brass mt-6 rounded-sm bg-surface px-6 py-10 text-center">
        <p className="font-body text-parchment-dim">
          No open scrims match those filters yet.
        </p>
      </div>
    );
  }

  let teamNames = new Map<string, string>();
  if (isSupabaseConfigured()) {
    const teamIds = scrims.filter((s) => s.team_id).map((s) => s.team_id as string);
    if (teamIds.length > 0) {
      const supabase = await createClient();
      const { data: teams } = await supabase
        .from("teams")
        .select("id, name, tag")
        .in("id", teamIds);
      teamNames = new Map((teams ?? []).map((t) => [t.id, `${t.name} [${t.tag}]`]));
    }
  }

  return (
    <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {scrims.map((scrim) => (
        <ScrimCard
          key={scrim.id}
          scrim={scrim}
          teamName={scrim.team_id ? teamNames.get(scrim.team_id) : undefined}
        />
      ))}
    </div>
  );
}

export default async function ScrimsPage({
  searchParams,
}: {
  searchParams: Promise<{
    region?: string;
    minRank?: string;
    maxRank?: string;
    after?: string;
  }>;
}) {
  const params = await searchParams;
  const region = params.region as Region | undefined;
  const minRank = params.minRank ? Number(params.minRank) : undefined;
  const maxRank = params.maxRank ? Number(params.maxRank) : undefined;

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-end sm:justify-between sm:text-left">
        <div>
          <p className="font-label text-xs tracking-[0.35em] text-verdigris uppercase">
            Arrangements
          </p>
          <h1 className="font-display mt-3 text-4xl text-parchment">Scrims</h1>
        </div>
        <Link
          href="/scrims/new"
          className={cn(
            buttonVariants(),
            "bg-brass text-primary-foreground hover:bg-brass/90",
          )}
        >
          Post a Scrim
        </Link>
      </div>

      <DecoDivider className="mt-8" />

      <div className="mt-8">
        <Suspense>
          <ScrimsFilterBar />
        </Suspense>
      </div>

      <Suspense
        fallback={
          <p className="font-body mt-6 text-center text-parchment-dim">
            Loading scrims…
          </p>
        }
      >
        <ScrimsList
          region={region}
          minRank={minRank}
          maxRank={maxRank}
          after={params.after}
        />
      </Suspense>
    </div>
  );
}
