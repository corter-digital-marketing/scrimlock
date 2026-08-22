"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  joinSoloQueueAction,
  joinPartyQueueAction,
  leaveQueueAction,
  type SimpleActionResult,
} from "@/lib/actions/pug-queue";
import { REGIONS, type Region } from "@/lib/regions";
import { MATCH_SIZE } from "@/lib/pug-matchmaking";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ActiveParty } from "@/lib/supabase/pug-parties";
import type { PugQueueEntryRow } from "@/lib/supabase/pug-matches";

export function QueuePanel({
  myQueueEntry,
  activeParty,
  currentUserId,
  queueCount,
  defaultRegion,
}: {
  myQueueEntry: PugQueueEntryRow | null;
  activeParty: ActiveParty | null;
  currentUserId: string;
  queueCount: number;
  defaultRegion?: Region;
}) {
  const [pending, startTransition] = useTransition();
  const [region, setRegion] = useState<string>(defaultRegion ?? "");

  function act(action: (fd: FormData) => Promise<SimpleActionResult>, fields: Record<string, string>) {
    startTransition(async () => {
      const fd = new FormData();
      for (const [key, value] of Object.entries(fields)) fd.set(key, value);
      const result = await action(fd);
      if (result?.error) toast.error(result.error);
    });
  }

  if (myQueueEntry) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-body text-parchment">
          Queued in <span className="text-brass">{myQueueEntry.region}</span> —{" "}
          {queueCount}/{MATCH_SIZE} players waiting there.
        </p>
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          className="border-oxblood/60 text-oxblood hover:bg-oxblood/10"
          onClick={() => act(leaveQueueAction, { entryId: myQueueEntry.id })}
        >
          {pending ? "Leaving…" : "Leave Queue"}
        </Button>
      </div>
    );
  }

  if (activeParty) {
    const isLeader = activeParty.party.leader_id === currentUserId;
    if (!isLeader) {
      return (
        <p className="font-body text-parchment-dim">
          Waiting for your party leader to queue up.
        </p>
      );
    }
    return (
      <Button
        type="button"
        disabled={pending}
        className="bg-brass text-primary-foreground hover:bg-brass/90"
        onClick={() => act(joinPartyQueueAction, { partyId: activeParty.party.id })}
      >
        {pending
          ? "Queueing…"
          : `Queue Party (${activeParty.members.length} in ${activeParty.party.region})`}
      </Button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select value={region} onValueChange={(v) => setRegion(v ?? "")}>
        <SelectTrigger className="w-40 border-brass-dim/60 bg-surface-2">
          <SelectValue placeholder="Region" />
        </SelectTrigger>
        <SelectContent>
          {REGIONS.map((r) => (
            <SelectItem key={r} value={r}>
              {r}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        type="button"
        disabled={pending || !region}
        className="bg-brass text-primary-foreground hover:bg-brass/90"
        onClick={() => act(joinSoloQueueAction, { region })}
      >
        {pending ? "Joining…" : "Join Queue Solo"}
      </Button>
    </div>
  );
}
