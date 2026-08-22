"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import {
  sendFriendRequestAction,
  acceptFriendRequestAction,
  removeFriendshipAction,
  type SimpleActionResult,
} from "@/lib/actions/friends";
import { Button } from "@/components/ui/button";
import type { FriendshipRow } from "@/lib/supabase/friends";

export function FriendButton({
  profileId,
  profileUsername,
  currentUserId,
  friendship,
}: {
  profileId: string;
  profileUsername: string;
  currentUserId: string;
  friendship: FriendshipRow | null;
}) {
  const [pending, startTransition] = useTransition();

  function run(action: (fd: FormData) => Promise<SimpleActionResult>) {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("profileUsername", profileUsername);
      fd.set("addresseeId", profileId);
      if (friendship) fd.set("friendshipId", friendship.id);
      const result = await action(fd);
      if (result?.error) toast.error(result.error);
    });
  }

  if (!friendship) {
    return (
      <Button
        type="button"
        disabled={pending}
        className="bg-brass text-primary-foreground hover:bg-brass/90"
        onClick={() => run(sendFriendRequestAction)}
      >
        {pending ? "Sending…" : "Add Friend"}
      </Button>
    );
  }

  if (friendship.status === "pending") {
    if (friendship.requester_id === currentUserId) {
      return (
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          className="border-brass-dim"
          onClick={() => run(removeFriendshipAction)}
        >
          {pending ? "Cancelling…" : "Cancel Request"}
        </Button>
      );
    }
    return (
      <div className="flex gap-2">
        <Button
          type="button"
          disabled={pending}
          className="bg-verdigris text-primary-foreground hover:bg-verdigris/90"
          onClick={() => run(acceptFriendRequestAction)}
        >
          Accept
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          className="border-oxblood/50 text-oxblood hover:bg-oxblood/10"
          onClick={() => run(removeFriendshipAction)}
        >
          Decline
        </Button>
      </div>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      disabled={pending}
      className="border-verdigris text-verdigris hover:bg-verdigris/10"
      onClick={() => run(removeFriendshipAction)}
    >
      {pending ? "Removing…" : "Friends ✓"}
    </Button>
  );
}
