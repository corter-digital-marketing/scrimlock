"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { inviteToTeamAction, type SimpleActionResult } from "@/lib/actions/teams";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function InviteFriendForm({
  teamId,
  friends,
}: {
  teamId: string;
  friends: { id: string; username: string; display_name: string }[];
}) {
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState<string>("");

  if (friends.length === 0) {
    return (
      <p className="font-body text-sm text-parchment-dim">
        None of your friends are free to invite right now.
      </p>
    );
  }

  function invite() {
    if (!selected) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.set("teamId", teamId);
      fd.set("inviteeId", selected);
      const result: SimpleActionResult = await inviteToTeamAction(fd);
      if (result?.error) toast.error(result.error);
      else setSelected("");
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select value={selected} onValueChange={(v) => setSelected(v ?? "")}>
        <SelectTrigger className="w-56 border-brass-dim/60 bg-surface-2">
          <SelectValue placeholder="Choose a friend" />
        </SelectTrigger>
        <SelectContent>
          {friends.map((friend) => (
            <SelectItem key={friend.id} value={friend.id}>
              {friend.display_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        type="button"
        disabled={pending || !selected}
        className="bg-brass text-primary-foreground hover:bg-brass/90"
        onClick={invite}
      >
        {pending ? "Inviting…" : "Invite"}
      </Button>
    </div>
  );
}
