"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Check, Loader2, Search, UserPlus } from "lucide-react";
import {
  searchPlayersAction,
  sendFriendRequestAction,
} from "@/lib/actions/friends";
import type { PlayerSearchResult } from "@/lib/supabase/friends";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function FriendSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlayerSearchResult[]>([]);
  const [searching, startSearch] = useTransition();
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [justSentIds, setJustSentIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) return;
    const timeout = setTimeout(() => {
      startSearch(async () => {
        setResults(await searchPlayersAction(trimmed));
      });
    }, 300);
    return () => clearTimeout(timeout);
  }, [query]);

  async function handleAdd(playerId: string) {
    setSendingId(playerId);
    const fd = new FormData();
    fd.set("addresseeId", playerId);
    const result = await sendFriendRequestAction(fd);
    setSendingId(null);
    if (result?.error) {
      toast.error(result.error);
    } else {
      setJustSentIds((prev) => new Set(prev).add(playerId));
    }
  }

  const trimmed = query.trim();

  return (
    <div>
      <div className="relative">
        <Search
          className="text-parchment-dim pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2"
          strokeWidth={1.5}
        />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search players by username or name…"
          className="border-brass-dim/60 bg-surface-2 pl-8"
        />
      </div>

      {searching ? (
        <p className="font-body text-parchment-dim mt-3 text-xs">Searching…</p>
      ) : trimmed.length >= 2 && results.length === 0 ? (
        <p className="font-body text-parchment-dim mt-3 text-xs">
          No players found.
        </p>
      ) : trimmed.length >= 2 && results.length > 0 ? (
        <ul className="mt-3 flex flex-col divide-y divide-brass-dim/20">
          {results.map((player) => {
            const sent = player.relation === "sent" || justSentIds.has(player.id);
            return (
              <li key={player.id} className="flex items-center gap-3 py-3">
                <Avatar className="border border-brass-dim/50">
                  {player.avatar_url ? (
                    <AvatarImage src={player.avatar_url} alt="" />
                  ) : null}
                  <AvatarFallback className="font-label bg-surface-2 text-xs text-brass">
                    {player.display_name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <Link
                  href={`/profile/${player.username}`}
                  className="font-body min-w-0 flex-1 truncate text-sm text-parchment hover:text-brass"
                >
                  {player.display_name}
                </Link>

                {player.relation === "friends" ? (
                  <span className="font-label text-parchment-dim text-[10px] tracking-widest uppercase">
                    Friends
                  </span>
                ) : player.relation === "incoming" ? (
                  <span className="font-label text-brass text-[10px] tracking-widest uppercase">
                    Respond below
                  </span>
                ) : sent ? (
                  <span className="font-label text-parchment-dim flex items-center gap-1 text-[10px] tracking-widest uppercase">
                    <Check className="h-3 w-3" />
                    Sent
                  </span>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="border-brass-dim gap-1"
                    disabled={sendingId === player.id}
                    onClick={() => handleAdd(player.id)}
                  >
                    {sendingId === player.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <UserPlus className="h-3 w-3" />
                    )}
                    Add
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
