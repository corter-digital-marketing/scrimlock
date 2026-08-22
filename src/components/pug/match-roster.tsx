import Link from "next/link";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { MatchPlayerEntry } from "@/lib/supabase/pug-matches";

export function MatchRoster({
  players,
  lobbyMakerId,
  won,
}: {
  players: MatchPlayerEntry[];
  lobbyMakerId: string;
  won?: boolean;
}) {
  return (
    <ul className="flex flex-col divide-y divide-brass-dim/15">
      {players.map((p) => {
        const delta = p.elo_after !== null ? p.elo_after - p.elo_before : null;
        return (
          <li key={p.id} className="flex items-center gap-3 py-2.5">
            <Avatar className="border border-brass-dim/50">
              {p.profile?.avatar_url ? <AvatarImage src={p.profile.avatar_url} alt="" /> : null}
              <AvatarFallback className="font-label bg-surface-2 text-xs text-brass">
                {(p.profile?.display_name ?? "?").slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              {p.profile ? (
                <Link
                  href={`/profile/${p.profile.username}`}
                  className="font-body block truncate text-sm text-parchment hover:text-brass"
                >
                  {p.profile.display_name}
                  {p.user_id === lobbyMakerId ? (
                    <span className="font-label ml-2 text-[9px] tracking-widest text-brass uppercase">
                      Lobby maker
                    </span>
                  ) : null}
                </Link>
              ) : (
                <span className="font-body text-sm text-parchment-dim">Unknown</span>
              )}
              <span className="font-label text-[10px] tracking-widest text-parchment-dim uppercase">
                {p.elo_before} ELO
              </span>
            </div>
            {delta !== null ? (
              <span
                className={cn(
                  "font-label text-xs tracking-widest uppercase",
                  delta > 0 ? "text-verdigris" : delta < 0 ? "text-oxblood" : "text-parchment-dim",
                )}
              >
                {delta > 0 ? "+" : ""}
                {delta}
              </span>
            ) : null}
          </li>
        );
      })}
      {won ? (
        <li className="font-label pt-2 text-center text-xs tracking-widest text-verdigris uppercase">
          Winner
        </li>
      ) : null}
    </ul>
  );
}
