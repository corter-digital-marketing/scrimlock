"use client";

import Link from "next/link";
import { useTransition } from "react";
import { toast } from "sonner";
import {
  acceptFriendRequestAction,
  removeFriendshipAction,
  type SimpleActionResult,
} from "@/lib/actions/friends";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { FriendshipRow, FriendProfile } from "@/lib/supabase/friends";

export function FriendRequestsList({
  requests,
}: {
  requests: (FriendshipRow & { requester: FriendProfile | null })[];
}) {
  const [pending, startTransition] = useTransition();

  function run(action: (fd: FormData) => Promise<SimpleActionResult>, friendshipId: string) {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("friendshipId", friendshipId);
      const result = await action(fd);
      if (result?.error) toast.error(result.error);
    });
  }

  if (requests.length === 0) {
    return (
      <p className="font-body text-sm text-parchment-dim">
        No pending friend requests.
      </p>
    );
  }

  return (
    <ul className="flex flex-col divide-y divide-brass-dim/20">
      {requests.map((r) => (
        <li key={r.id} className="flex items-center gap-3 py-3">
          <Avatar className="border border-brass-dim/50">
            {r.requester?.avatar_url ? (
              <AvatarImage src={r.requester.avatar_url} alt="" />
            ) : null}
            <AvatarFallback className="font-label bg-surface-2 text-xs text-brass">
              {(r.requester?.display_name ?? "?").slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            {r.requester ? (
              <Link
                href={`/profile/${r.requester.username}`}
                className="font-body truncate text-sm text-parchment hover:text-brass"
              >
                {r.requester.display_name}
              </Link>
            ) : (
              <span className="font-body text-sm text-parchment-dim">Unknown</span>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              disabled={pending}
              className="bg-verdigris text-primary-foreground hover:bg-verdigris/90"
              onClick={() => run(acceptFriendRequestAction, r.id)}
            >
              Accept
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={pending}
              className="border-oxblood/50 text-oxblood hover:bg-oxblood/10"
              onClick={() => run(removeFriendshipAction, r.id)}
            >
              Decline
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
