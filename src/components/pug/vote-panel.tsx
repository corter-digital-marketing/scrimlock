"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { voteAction } from "@/lib/actions/pug-matches";
import { Button } from "@/components/ui/button";
import { VOTES_TO_CONFIRM } from "@/lib/pug-matchmaking";

export function VotePanel({
  matchId,
  team1Votes,
  team2Votes,
  myVote,
}: {
  matchId: string;
  team1Votes: number;
  team2Votes: number;
  myVote: number | null;
}) {
  const [pending, startTransition] = useTransition();

  function cast(team: "1" | "2") {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("matchId", matchId);
      fd.set("team", team);
      const result = await voteAction(fd);
      if (result?.error) toast.error(result.error);
    });
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="font-body text-sm text-parchment-dim">
        Who won? First to {VOTES_TO_CONFIRM} votes locks it in.
        {myVote !== null ? " Clicked the wrong one? You can change it below." : ""}
      </p>
      <div className="flex gap-4">
        <Button
          type="button"
          disabled={pending}
          variant={myVote === 1 ? undefined : "outline"}
          className={
            myVote === 1
              ? "bg-brass text-primary-foreground hover:bg-brass/90"
              : "border-brass text-brass hover:bg-brass/10"
          }
          onClick={() => cast("1")}
        >
          {myVote === 1 ? "✓ " : ""}Team 1 ({team1Votes})
        </Button>
        <Button
          type="button"
          disabled={pending}
          variant={myVote === 2 ? undefined : "outline"}
          className={
            myVote === 2
              ? "bg-verdigris text-primary-foreground hover:bg-verdigris/90"
              : "border-verdigris text-verdigris hover:bg-verdigris/10"
          }
          onClick={() => cast("2")}
        >
          {myVote === 2 ? "✓ " : ""}Team 2 ({team2Votes})
        </Button>
      </div>
    </div>
  );
}
