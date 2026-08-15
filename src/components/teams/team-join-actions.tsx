"use client";

import Link from "next/link";
import { useTransition } from "react";
import { toast } from "sonner";
import {
  requestToJoinAction,
  cancelJoinRequestAction,
  leaveTeamAction,
  type SimpleActionResult,
} from "@/lib/actions/teams";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { TeamMemberStatus, TeamRole } from "@/lib/supabase/database.types";

export function TeamJoinActions({
  teamId,
  isRecruiting,
  status,
  role,
}: {
  teamId: string;
  isRecruiting: boolean;
  status: TeamMemberStatus | null;
  role: TeamRole | null;
}) {
  const [pending, startTransition] = useTransition();
  const canManage = role === "owner" || role === "captain";

  function run(action: (fd: FormData) => Promise<SimpleActionResult>) {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("teamId", teamId);
      const result = await action(fd);
      if (result?.error) toast.error(result.error);
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      {canManage ? (
        <Link
          href={`/teams/${teamId}/manage`}
          className={cn(buttonVariants({ variant: "outline" }), "border-brass-dim")}
        >
          Manage
        </Link>
      ) : null}

      {status === null && isRecruiting ? (
        <Button
          disabled={pending}
          onClick={() => run(requestToJoinAction)}
          className="bg-brass text-primary-foreground hover:bg-brass/90"
        >
          {pending ? "Requesting…" : "Request to Join"}
        </Button>
      ) : null}

      {status === "pending" ? (
        <Button
          disabled={pending}
          variant="outline"
          className="border-brass-dim"
          onClick={() => run(cancelJoinRequestAction)}
        >
          {pending ? "Cancelling…" : "Cancel Request"}
        </Button>
      ) : null}

      {status === "active" && role !== "owner" ? (
        <Button
          disabled={pending}
          variant="outline"
          className="border-oxblood/60 text-oxblood hover:bg-oxblood/10"
          onClick={() => run(leaveTeamAction)}
        >
          {pending ? "Leaving…" : "Leave Team"}
        </Button>
      ) : null}
    </div>
  );
}
