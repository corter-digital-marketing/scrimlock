import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/auth";
import {
  getActiveParty,
  getPartyInvites,
  getInvitableFriendsForParty,
} from "@/lib/supabase/pug-parties";
import { getMyActiveMatch, getMyQueueEntry, getQueueCount } from "@/lib/supabase/pug-matches";
import { tryFormMatch } from "@/lib/pug-matchmaker";
import { PartyInvitesBanner } from "@/components/pug/party-invites-banner";
import { PartyPanel } from "@/components/pug/party-panel";
import { QueuePanel } from "@/components/pug/queue-panel";
import { PugAutoRefresh } from "@/components/pug/pug-auto-refresh";
import { DecoDivider } from "@/components/site/deco-divider";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Region } from "@/lib/regions";

export const metadata: Metadata = { title: "PUG" };
export const dynamic = "force-dynamic";

export default async function PugPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6 sm:py-20 lg:px-8">
        <p className="font-label text-xs tracking-[0.35em] text-verdigris uppercase">
          PUG Scrims
        </p>
        <h1 className="font-display mt-3 text-4xl text-parchment">
          Find a Match
        </h1>
        <p className="font-body mt-4 text-parchment-dim">
          Sign in to queue up — solo or with a party.
        </p>
        <Link
          href="/login?next=/pug"
          className={cn(buttonVariants(), "bg-brass text-primary-foreground hover:bg-brass/90 mt-6")}
        >
          Sign In
        </Link>
      </div>
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

  const [activeParty, partyInvites] = await Promise.all([
    getActiveParty(user.id),
    getPartyInvites(user.id),
  ]);

  const invitableFriends =
    activeParty && activeParty.party.leader_id === user.id
      ? await getInvitableFriendsForParty(activeParty.party.id, user.id)
      : [];

  const region = (myQueueEntry?.region ?? activeParty?.party.region) as Region | undefined;
  const queueCount = region ? await getQueueCount(region) : 0;

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <PugAutoRefresh />

      <div className="text-center">
        <p className="font-label text-xs tracking-[0.35em] text-verdigris uppercase">
          PUG Scrims
        </p>
        <h1 className="font-display mt-3 text-4xl text-parchment">
          Find a Match
        </h1>
        <p className="font-body mx-auto mt-4 max-w-lg text-parchment-dim">
          Solo or with a party — 6v6, matched as fast as the queue allows.
        </p>
      </div>

      <DecoDivider className="mt-8" />

      <PartyInvitesBanner invites={partyInvites} />

      <div className="frame-brass mt-8 rounded-sm bg-surface px-6 py-8 sm:px-10">
        <p className="font-label mb-4 text-xs tracking-widest text-brass-dim uppercase">
          Queue
        </p>
        <QueuePanel
          myQueueEntry={myQueueEntry}
          activeParty={activeParty}
          currentUserId={user.id}
          queueCount={queueCount}
          defaultRegion={region}
        />
      </div>

      <div className="frame-brass mt-8 rounded-sm bg-surface px-6 py-8 sm:px-10">
        <p className="font-label mb-4 text-xs tracking-widest text-brass-dim uppercase">
          Party
        </p>
        <PartyPanel
          activeParty={activeParty}
          currentUserId={user.id}
          invitableFriends={invitableFriends}
        />
      </div>
    </div>
  );
}
