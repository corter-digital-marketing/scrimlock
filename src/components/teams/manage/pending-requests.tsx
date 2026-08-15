"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import {
  acceptRequestAction,
  declineRequestAction,
  type SimpleActionResult,
} from "@/lib/actions/teams";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { RosterEntry } from "@/lib/supabase/teams";

export function PendingRequests({
  teamId,
  requests,
}: {
  teamId: string;
  requests: RosterEntry[];
}) {
  const [pending, startTransition] = useTransition();

  function run(action: (fd: FormData) => Promise<SimpleActionResult>, memberId: string) {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("teamId", teamId);
      fd.set("memberId", memberId);
      const result = await action(fd);
      if (result?.error) toast.error(result.error);
    });
  }

  if (requests.length === 0) {
    return (
      <p className="font-body text-sm text-parchment-dim">
        No pending requests.
      </p>
    );
  }

  return (
    <ul className="flex flex-col divide-y divide-brass-dim/20">
      {requests.map((entry) => (
        <li key={entry.id} className="flex items-center gap-3 py-3">
          <Avatar className="border border-brass-dim/50">
            {entry.profile?.avatar_url ? (
              <AvatarImage src={entry.profile.avatar_url} alt="" />
            ) : null}
            <AvatarFallback className="font-label bg-surface-2 text-xs text-brass">
              {(entry.profile?.display_name || entry.profile?.username || "?")
                .slice(0, 2)
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="font-body truncate text-sm text-parchment">
              {entry.profile?.display_name ?? "Unknown player"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              disabled={pending}
              className="bg-verdigris text-primary-foreground hover:bg-verdigris/90"
              onClick={() => run(acceptRequestAction, entry.id)}
            >
              Accept
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={pending}
              className="border-oxblood/50 text-oxblood hover:bg-oxblood/10"
              onClick={() => run(declineRequestAction, entry.id)}
            >
              Decline
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
