"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  createPartyAction,
  inviteToPartyAction,
  leavePartyAction,
  removePartyMemberAction,
  type SimpleActionResult,
} from "@/lib/actions/pug-parties";
import { REGIONS, type Region } from "@/lib/regions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ActiveParty, PartyMemberProfile } from "@/lib/supabase/pug-parties";

function run(action: (fd: FormData) => Promise<SimpleActionResult>, fields: Record<string, string>) {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) fd.set(key, value);
  return action(fd);
}

export function PartyPanel({
  activeParty,
  currentUserId,
  invitableFriends,
  defaultRegion,
}: {
  activeParty: ActiveParty | null;
  currentUserId: string;
  invitableFriends: { id: string; username: string; display_name: string }[];
  defaultRegion?: Region;
}) {
  const [pending, startTransition] = useTransition();
  const [region, setRegion] = useState<string>(defaultRegion ?? "");
  const [selectedFriend, setSelectedFriend] = useState<string>("");

  function act(action: (fd: FormData) => Promise<SimpleActionResult>, fields: Record<string, string>) {
    startTransition(async () => {
      const result = await run(action, fields);
      if (result?.error) toast.error(result.error);
    });
  }

  if (!activeParty) {
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
          variant="outline"
          disabled={pending || !region}
          className="border-brass-dim"
          onClick={() => act(createPartyAction, { region })}
        >
          {pending ? "Creating…" : "Create a Party"}
        </Button>
      </div>
    );
  }

  const isLeader = activeParty.party.leader_id === currentUserId;

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-wrap gap-3">
        {activeParty.members.map((member: PartyMemberProfile) => (
          <li key={member.id} className="flex flex-col items-center gap-1">
            <Avatar className="border border-brass-dim/50">
              {member.avatar_url ? <AvatarImage src={member.avatar_url} alt="" /> : null}
              <AvatarFallback className="font-label bg-surface-2 text-xs text-brass">
                {member.display_name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="font-label max-w-16 truncate text-[10px] tracking-widest text-parchment-dim uppercase">
              {member.display_name}
            </span>
            {isLeader && member.id !== currentUserId ? (
              <button
                type="button"
                disabled={pending}
                className="font-label text-[9px] tracking-widest text-oxblood uppercase hover:underline"
                onClick={() => act(removePartyMemberAction, { partyId: activeParty.party.id, memberId: member.id })}
              >
                Remove
              </button>
            ) : null}
          </li>
        ))}
      </ul>

      {isLeader && invitableFriends.length > 0 ? (
        <div className="flex flex-wrap items-center gap-3">
          <Select value={selectedFriend} onValueChange={(v) => setSelectedFriend(v ?? "")}>
            <SelectTrigger className="w-48 border-brass-dim/60 bg-surface-2">
              <SelectValue placeholder="Invite a friend" />
            </SelectTrigger>
            <SelectContent>
              {invitableFriends.map((friend) => (
                <SelectItem key={friend.id} value={friend.id}>
                  {friend.display_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="outline"
            disabled={pending || !selectedFriend}
            className="border-brass-dim"
            onClick={() => {
              act(inviteToPartyAction, { partyId: activeParty.party.id, inviteeId: selectedFriend });
              setSelectedFriend("");
            }}
          >
            Invite
          </Button>
        </div>
      ) : null}

      <Button
        type="button"
        variant="outline"
        disabled={pending}
        className="w-fit border-oxblood/60 text-oxblood hover:bg-oxblood/10"
        onClick={() => act(leavePartyAction, { partyId: activeParty.party.id })}
      >
        {isLeader ? "Disband Party" : "Leave Party"}
      </Button>
    </div>
  );
}
