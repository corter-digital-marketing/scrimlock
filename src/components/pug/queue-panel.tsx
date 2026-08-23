"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, Search, X } from "lucide-react";
import {
  joinSoloQueueAction,
  joinPartyQueueAction,
  leaveQueueAction,
  type SimpleActionResult,
} from "@/lib/actions/pug-queue";
import { isPugRegion, type PugRegion } from "@/lib/pug-regions";
import { MATCH_SIZE } from "@/lib/pug-matchmaking";
import { Button } from "@/components/ui/button";
import { RegionToggle } from "@/components/pug/region-toggle";
import { QueueSlots } from "@/components/pug/queue-slots";
import type { ActiveParty } from "@/lib/supabase/pug-parties";
import type { PugQueueEntryRow } from "@/lib/supabase/pug-matches";

export function QueuePanel({
  myQueueEntry,
  activeParty,
  currentUserId,
  queueCounts,
  defaultRegion,
}: {
  myQueueEntry: PugQueueEntryRow | null;
  activeParty: ActiveParty | null;
  currentUserId: string;
  queueCounts: Record<PugRegion, number>;
  defaultRegion?: PugRegion;
}) {
  const [pending, startTransition] = useTransition();
  const [region, setRegion] = useState<PugRegion | "">(defaultRegion ?? "");

  function act(action: (fd: FormData) => Promise<SimpleActionResult>, fields: Record<string, string>) {
    startTransition(async () => {
      const fd = new FormData();
      for (const [key, value] of Object.entries(fields)) fd.set(key, value);
      const result = await action(fd);
      if (result?.error) toast.error(result.error);
    });
  }

  if (myQueueEntry) {
    const queuedRegion = isPugRegion(myQueueEntry.region) ? myQueueEntry.region : "NA";
    const count = queueCounts[queuedRegion] ?? myQueueEntry.size;
    return (
      <div className="flex flex-col items-center gap-5 py-2">
        <div className="relative">
          <Search
            className="text-verdigris h-8 w-8 animate-pulse"
            strokeWidth={1.5}
            aria-hidden="true"
          />
        </div>
        <div className="text-center">
          <p className="font-display text-parchment text-lg">
            Searching in <span className="text-brass">{queuedRegion}</span>
          </p>
          <p className="font-label text-parchment-dim mt-1 text-xs tracking-widest uppercase">
            {count}/{MATCH_SIZE} players
          </p>
        </div>
        <QueueSlots filled={count} />
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          className="border-oxblood/60 text-oxblood hover:bg-oxblood/10 gap-1.5"
          onClick={() => act(leaveQueueAction, { entryId: myQueueEntry.id })}
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
          Leave Queue
        </Button>
      </div>
    );
  }

  if (activeParty) {
    const isLeader = activeParty.party.leader_id === currentUserId;
    const partyRegion = isPugRegion(activeParty.party.region) ? activeParty.party.region : "NA";
    if (!isLeader) {
      return (
        <p className="font-body text-parchment-dim py-6 text-center text-sm">
          Waiting for your party leader to queue up in{" "}
          <span className="text-brass">{partyRegion}</span>…
        </p>
      );
    }
    return (
      <div className="flex flex-col items-center gap-4 py-2">
        <p className="font-body text-parchment-dim text-sm">
          Queueing as a party of {activeParty.members.length} in{" "}
          <span className="text-brass">{partyRegion}</span>
        </p>
        <Button
          type="button"
          size="lg"
          disabled={pending}
          className="bg-brass text-primary-foreground hover:bg-brass/90 gap-2 shadow-[0_0_0_1px_var(--brass-dim)]"
          onClick={() => act(joinPartyQueueAction, { partyId: activeParty.party.id })}
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          {pending ? "Queueing…" : "Queue Party"}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-5 py-2">
      <RegionToggle value={region} onChange={setRegion} counts={queueCounts} disabled={pending} />
      <Button
        type="button"
        size="lg"
        disabled={pending || !region}
        className="bg-brass text-primary-foreground hover:bg-brass/90 w-full max-w-56 gap-2 shadow-[0_0_0_1px_var(--brass-dim)]"
        onClick={() => region && act(joinSoloQueueAction, { region })}
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
        {pending ? "Joining…" : "Find Match"}
      </Button>
    </div>
  );
}
