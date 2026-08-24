"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { CheckCircle2, Loader2, Timer } from "lucide-react";
import { checkInAction } from "@/lib/actions/pug-matches";
import { LOBBY_CHECKIN_WINDOW_MS } from "@/lib/pug-matchmaking";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { MatchPlayerEntry } from "@/lib/supabase/pug-matches";

export function CheckInPanel({
  matchId,
  players,
  currentUserId,
  lobbyOpenedAt,
}: {
  matchId: string;
  players: MatchPlayerEntry[];
  currentUserId: string;
  lobbyOpenedAt: string;
}) {
  const [pending, startTransition] = useTransition();
  const me = players.find((p) => p.user_id === currentUserId);
  const checkedInCount = players.filter((p) => p.checked_in_at).length;
  const deadline = new Date(lobbyOpenedAt).getTime() + LOBBY_CHECKIN_WINDOW_MS;
  const [remainingMs, setRemainingMs] = useState(() => deadline - Date.now());

  useEffect(() => {
    const id = setInterval(() => setRemainingMs(deadline - Date.now()), 1000);
    return () => clearInterval(id);
  }, [deadline]);

  function checkIn() {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("matchId", matchId);
      const result = await checkInAction(fd);
      if (result?.error) toast.error(result.error);
    });
  }

  const remaining = Math.max(0, remainingMs);
  const expired = remainingMs <= 0;
  const mm = Math.floor(remaining / 60000);
  const ss = Math.floor((remaining % 60000) / 1000)
    .toString()
    .padStart(2, "0");
  const alreadyIn = Boolean(me?.checked_in_at);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-2">
        <Timer
          className={cn("h-4 w-4", expired ? "text-oxblood" : "text-parchment-dim")}
          strokeWidth={1.5}
        />
        <p
          className={cn(
            "font-label text-xs tracking-widest uppercase",
            expired ? "text-oxblood" : "text-parchment-dim",
          )}
        >
          {expired ? "Check-in window closed" : `${mm}:${ss} left to check in`}
        </p>
      </div>
      <p className="font-body text-sm text-parchment-dim">{checkedInCount}/12 checked in</p>
      <Button
        type="button"
        disabled={pending || alreadyIn || expired}
        onClick={checkIn}
        className={cn(
          "gap-1.5",
          alreadyIn
            ? "bg-verdigris text-primary-foreground hover:bg-verdigris"
            : "bg-brass text-primary-foreground hover:bg-brass/90",
        )}
      >
        {alreadyIn ? (
          <>
            <CheckCircle2 className="h-4 w-4" />
            You&apos;re checked in
          </>
        ) : pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Checking in…
          </>
        ) : (
          "I'm in the lobby"
        )}
      </Button>
    </div>
  );
}
