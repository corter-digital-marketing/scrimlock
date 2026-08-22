"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { removeMemberAction } from "@/lib/actions/teams";
import { Button } from "@/components/ui/button";
import type { RosterEntry } from "@/lib/supabase/teams";

export function InvitedRowControls({
  teamId,
  entry,
}: {
  teamId: string;
  entry: RosterEntry;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={pending}
      className="border-oxblood/50 text-oxblood hover:bg-oxblood/10"
      onClick={() => {
        startTransition(async () => {
          const fd = new FormData();
          fd.set("teamId", teamId);
          fd.set("memberId", entry.id);
          const result = await removeMemberAction(fd);
          if (result?.error) toast.error(result.error);
        });
      }}
    >
      Cancel Invite
    </Button>
  );
}
