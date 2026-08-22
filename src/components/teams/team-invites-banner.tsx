"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import {
  acceptTeamInviteAction,
  declineTeamInviteAction,
  type SimpleActionResult,
} from "@/lib/actions/teams";
import { Button } from "@/components/ui/button";
import type { TeamMemberRow, TeamRow } from "@/lib/supabase/teams";

export function TeamInvitesBanner({
  invites,
}: {
  invites: (TeamMemberRow & { team: TeamRow | null })[];
}) {
  const [pending, startTransition] = useTransition();

  if (invites.length === 0) return null;

  function run(action: (fd: FormData) => Promise<SimpleActionResult>, teamId: string) {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("teamId", teamId);
      const result = await action(fd);
      if (result?.error) toast.error(result.error);
    });
  }

  return (
    <div className="frame-brass mb-8 rounded-sm bg-surface p-4">
      <p className="font-label mb-3 text-xs tracking-widest text-brass uppercase">
        Team invites
      </p>
      <ul className="flex flex-col divide-y divide-brass-dim/20">
        {invites.map((invite) => (
          <li key={invite.id} className="flex items-center justify-between gap-3 py-2.5">
            <span className="font-body text-sm text-parchment">
              {invite.team ? `${invite.team.name} [${invite.team.tag}]` : "Unknown team"}
            </span>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                disabled={pending}
                className="bg-verdigris text-primary-foreground hover:bg-verdigris/90"
                onClick={() => run(acceptTeamInviteAction, invite.team_id)}
              >
                Accept
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={pending}
                className="border-oxblood/50 text-oxblood hover:bg-oxblood/10"
                onClick={() => run(declineTeamInviteAction, invite.team_id)}
              >
                Decline
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
