"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import {
  removeMemberAction,
  updateMemberRoleAction,
  type SimpleActionResult,
} from "@/lib/actions/teams";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { RosterEntry } from "@/lib/supabase/teams";

export function RosterRowControls({
  teamId,
  entry,
}: {
  teamId: string;
  entry: RosterEntry;
}) {
  const [pending, startTransition] = useTransition();

  if (entry.role_on_team === "owner") return null;

  function run(
    action: (fd: FormData) => Promise<SimpleActionResult>,
    extra?: Record<string, string>,
  ) {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("teamId", teamId);
      fd.set("memberId", entry.id);
      if (extra) {
        for (const [key, value] of Object.entries(extra)) fd.set(key, value);
      }
      const result = await action(fd);
      if (result?.error) toast.error(result.error);
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Select
        value={entry.role_on_team}
        onValueChange={(v) => run(updateMemberRoleAction, { role: v as string })}
        disabled={pending}
      >
        <SelectTrigger size="sm" className="w-28 border-brass-dim/60 bg-surface-2">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="captain">Captain</SelectItem>
          <SelectItem value="player">Player</SelectItem>
          <SelectItem value="sub">Sub</SelectItem>
        </SelectContent>
      </Select>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={pending}
        className="border-oxblood/50 text-oxblood hover:bg-oxblood/10"
        onClick={() => run(removeMemberAction)}
      >
        Remove
      </Button>
    </div>
  );
}
