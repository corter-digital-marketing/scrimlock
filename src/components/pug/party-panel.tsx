"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, UserPlus, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  createPartyAction,
  inviteToPartyAction,
  leavePartyAction,
  removePartyMemberAction,
  type SimpleActionResult,
} from "@/lib/actions/pug-parties";
import { type PugRegion } from "@/lib/pug-regions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { RegionToggle } from "@/components/pug/region-toggle";
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
  defaultRegion?: PugRegion;
}) {
  const [pending, startTransition] = useTransition();
  const [region, setRegion] = useState<PugRegion | "">(defaultRegion ?? "");
  const [selectedFriend, setSelectedFriend] = useState<string>("");

  function act(action: (fd: FormData) => Promise<SimpleActionResult>, fields: Record<string, string>) {
    startTransition(async () => {
      const result = await run(action, fields);
      if (result?.error) toast.error(result.error);
    });
  }

  if (!activeParty) {
    return (
      <div className="flex flex-col items-center gap-4 py-2">
        <Users className="text-parchment-dim h-6 w-6" strokeWidth={1.5} aria-hidden="true" />
        <p className="font-body text-parchment-dim max-w-52 text-center text-sm">
          Bring friends into the same match — form a party before you queue.
        </p>
        <RegionToggle value={region} onChange={setRegion} disabled={pending} />
        <Button
          type="button"
          variant="outline"
          disabled={pending || !region}
          className="border-brass-dim gap-1.5"
          onClick={() => region && act(createPartyAction, { region })}
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
          {pending ? "Creating…" : "Create a Party"}
        </Button>
      </div>
    );
  }

  const isLeader = activeParty.party.leader_id === currentUserId;

  return (
    <div className="flex flex-col gap-4">
      <p className="font-label text-brass-dim text-center text-[10px] tracking-widest uppercase">
        {activeParty.party.region} &middot; {activeParty.members.length}/6
      </p>
      <ul className="flex flex-wrap justify-center gap-4">
        {activeParty.members.map((member: PartyMemberProfile) => {
          const isPartyLeader = member.id === activeParty.party.leader_id;
          return (
            <li key={member.id} className="flex flex-col items-center gap-1.5">
              <Avatar
                className={cn(
                  "h-12 w-12 border-2",
                  isPartyLeader ? "border-brass" : "border-brass-dim/40",
                )}
              >
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
                  className="font-label text-oxblood text-[9px] tracking-widest uppercase hover:underline"
                  onClick={() => act(removePartyMemberAction, { partyId: activeParty.party.id, memberId: member.id })}
                >
                  Remove
                </button>
              ) : null}
            </li>
          );
        })}
      </ul>

      {isLeader && invitableFriends.length > 0 ? (
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Select
            value={selectedFriend}
            items={Object.fromEntries(invitableFriends.map((f) => [f.id, f.display_name]))}
            onValueChange={(v) => setSelectedFriend(v ?? "")}
          >
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
            className="border-brass-dim gap-1.5"
            onClick={() => {
              act(inviteToPartyAction, { partyId: activeParty.party.id, inviteeId: selectedFriend });
              setSelectedFriend("");
            }}
          >
            <UserPlus className="h-4 w-4" />
            Invite
          </Button>
        </div>
      ) : null}

      <Button
        type="button"
        variant="outline"
        disabled={pending}
        className="border-oxblood/60 text-oxblood hover:bg-oxblood/10 mx-auto w-fit"
        onClick={() => act(leavePartyAction, { partyId: activeParty.party.id })}
      >
        {isLeader ? "Disband Party" : "Leave Party"}
      </Button>
    </div>
  );
}
