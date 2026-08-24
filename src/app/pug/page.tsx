import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Swords, Trophy, Users } from "lucide-react";
import { getCurrentUser } from "@/lib/supabase/auth";
import {
  getActiveParty,
  getPartyInvites,
  getInvitableFriendsForParty,
} from "@/lib/supabase/pug-parties";
import { getMyActiveMatch, getMyQueueEntry, getQueueCounts } from "@/lib/supabase/pug-matches";
import { tryFormMatch } from "@/lib/pug-matchmaker";
import { getPugActivityStats, type PugActivityStats } from "@/lib/pug-stats";
import { isPugRegion } from "@/lib/pug-regions";
import { PartyInvitesBanner } from "@/components/pug/party-invites-banner";
import { PartyPanel } from "@/components/pug/party-panel";
import { QueuePanel } from "@/components/pug/queue-panel";
import { PugAutoRefresh } from "@/components/pug/pug-auto-refresh";
import { SigilMark } from "@/components/site/sigil-mark";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "PUG" };
export const dynamic = "force-dynamic";

function PugHero({
  stats,
  children,
}: {
  stats: PugActivityStats;
  children: ReactNode;
}) {
  return (
    <section className="deco-corners relative overflow-hidden border-b border-brass-dim/40 bg-surface">
      <SigilMark
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 right-[-6rem] h-[28rem] w-[28rem] -translate-y-1/2 text-brass opacity-[0.05]"
      />
      <div className="relative mx-auto max-w-2xl px-4 py-16 text-center sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto flex items-center justify-center gap-3">
          <Swords className="h-6 w-6 text-verdigris" strokeWidth={1.5} />
          <p className="font-label text-xs tracking-[0.35em] text-verdigris uppercase">
            PUG Scrims
          </p>
        </div>
        <h1 className="font-display mt-3 text-4xl text-parchment sm:text-5xl">
          Find a Match
        </h1>
        <p className="font-body mx-auto mt-4 max-w-lg text-parchment-dim">
          Solo or with a party — 6v6, matched as fast as the queue allows.
        </p>

        <div className="mx-auto mt-6 flex w-fit items-center gap-6 rounded-sm border border-brass-dim/40 bg-void/40 px-6 py-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-verdigris" strokeWidth={1.5} />
            <span className="font-display text-lg text-parchment">{stats.totalQueued}</span>
            <span className="font-label text-parchment-dim text-[10px] tracking-widest uppercase">
              queueing
            </span>
          </div>
          <span className="h-6 w-px bg-brass-dim/40" />
          <div className="flex items-center gap-2">
            <Swords className="h-4 w-4 text-brass" strokeWidth={1.5} />
            <span className="font-display text-lg text-parchment">{stats.activeMatches}</span>
            <span className="font-label text-parchment-dim text-[10px] tracking-widest uppercase">
              live {stats.activeMatches === 1 ? "match" : "matches"}
            </span>
          </div>
        </div>

        {children}
      </div>
    </section>
  );
}

export default async function PugPage() {
  const user = await getCurrentUser();

  if (!user) {
    const stats = await getPugActivityStats();
    return (
      <PugHero stats={stats}>
        <Link
          href="/login?next=/pug"
          className={cn(buttonVariants({ size: "lg" }), "bg-brass text-primary-foreground hover:bg-brass/90 mt-8 shadow-[0_0_0_1px_var(--brass-dim)]")}
        >
          Sign In
        </Link>
      </PugHero>
    );
  }

  const existingMatch = await getMyActiveMatch(user.id);
  if (existingMatch) redirect(`/pug/${existingMatch.id}`);

  let myQueueEntry = await getMyQueueEntry(user.id);
  if (myQueueEntry) {
    await tryFormMatch(myQueueEntry.region);
    const formedMatch = await getMyActiveMatch(user.id);
    if (formedMatch) redirect(`/pug/${formedMatch.id}`);
    myQueueEntry = await getMyQueueEntry(user.id);
  }

  const [activeParty, partyInvites, queueCounts, stats] = await Promise.all([
    getActiveParty(user.id),
    getPartyInvites(user.id),
    getQueueCounts(),
    getPugActivityStats(),
  ]);

  const invitableFriends =
    activeParty && activeParty.party.leader_id === user.id
      ? await getInvitableFriendsForParty(activeParty.party.id, user.id)
      : [];

  const rawRegion = myQueueEntry?.region ?? activeParty?.party.region;
  const defaultRegion = isPugRegion(rawRegion) ? rawRegion : undefined;

  return (
    <div>
      <PugAutoRefresh />

      <PugHero stats={stats}>
        <Link
          href="/pug/leaderboard"
          className="font-label text-brass-dim hover:text-brass mt-6 inline-flex items-center gap-1.5 text-xs tracking-widest uppercase transition-colors"
        >
          <Trophy className="h-3.5 w-3.5" />
          Leaderboard
        </Link>
      </PugHero>

      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
        <PartyInvitesBanner invites={partyInvites} />

        <div className="frame-brass rounded-sm bg-surface px-6 py-8 sm:px-10">
          <div className="flex items-center justify-center gap-2">
            <Swords className="h-4 w-4 text-brass-dim" strokeWidth={1.5} />
            <p className="font-label text-xs tracking-widest text-brass-dim uppercase">
              Queue
            </p>
          </div>
          <div className="mt-5">
            <QueuePanel
              myQueueEntry={myQueueEntry}
              activeParty={activeParty}
              currentUserId={user.id}
              queueCounts={queueCounts}
              defaultRegion={defaultRegion}
            />
          </div>
        </div>

        <div className="mt-8 flex items-center justify-center gap-3 text-brass-dim">
          <span className="h-px flex-1 bg-current opacity-40" />
          <Users className="h-4 w-4" strokeWidth={1.5} />
          <span className="h-px flex-1 bg-current opacity-40" />
        </div>

        <div className="frame-brass mt-8 rounded-sm bg-surface px-6 py-8 sm:px-10">
          <p className="font-label mb-1 text-center text-xs tracking-widest text-brass-dim uppercase">
            Party
          </p>
          <div className="mt-5">
            <PartyPanel
              activeParty={activeParty}
              currentUserId={user.id}
              invitableFriends={invitableFriends}
              defaultRegion={defaultRegion}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
