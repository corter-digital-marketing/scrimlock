import Image from "next/image";
import Link from "next/link";
import { Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { pugEloToRank } from "@/lib/pug-elo";
import { getRankById, subrankToRoman } from "@/lib/ranks";
import type { MatchPlayerEntry } from "@/lib/supabase/pug-matches";

const TEAM_STYLE = {
  1: { ring: "border-brass", text: "text-brass" },
  2: { ring: "border-verdigris", text: "text-verdigris" },
} as const;

export function MatchRoster({
  players,
  lobbyMakerId,
  team,
  won,
  showCheckIn,
}: {
  players: MatchPlayerEntry[];
  lobbyMakerId: string;
  team: 1 | 2;
  won?: boolean;
  /** Show who's actually confirmed they're in the lobby — only meaningful
   * once the code's been posted and check-in has opened. */
  showCheckIn?: boolean;
}) {
  const style = TEAM_STYLE[team];

  return (
    <ul className="flex flex-col divide-y divide-brass-dim/15">
      {players.map((p) => {
        const delta = p.elo_after !== null ? p.elo_after - p.elo_before : null;
        const pugRank = pugEloToRank(p.elo_before);
        const rank = getRankById(pugRank.rankId);
        const numeral = subrankToRoman(pugRank.subrank);
        return (
          <li key={p.id} className="flex items-center gap-3 py-2.5">
            <div className="relative shrink-0">
              <Avatar className={cn("border-2", style.ring)}>
                {p.profile?.avatar_url ? <AvatarImage src={p.profile.avatar_url} alt="" /> : null}
                <AvatarFallback className="font-label bg-surface-2 text-xs text-brass">
                  {(p.profile?.display_name ?? "?").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {showCheckIn ? (
                <span
                  aria-label={p.checked_in_at ? "Checked in" : "Not checked in"}
                  title={p.checked_in_at ? "Checked in" : "Not checked in"}
                  className={cn(
                    "border-void absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full border-2",
                    p.checked_in_at ? "bg-verdigris" : "bg-parchment-dim/40",
                  )}
                />
              ) : null}
            </div>

            <div className="min-w-0 flex-1">
              {p.profile ? (
                <Link
                  href={`/profile/${p.profile.username}`}
                  className="font-body flex items-center gap-1.5 truncate text-sm text-parchment hover:text-brass"
                >
                  {p.profile.display_name}
                  {p.user_id === lobbyMakerId ? (
                    <Crown
                      className="h-3.5 w-3.5 shrink-0 text-brass"
                      aria-label="Lobby maker"
                    />
                  ) : null}
                </Link>
              ) : (
                <span className="font-body text-sm text-parchment-dim">Unknown</span>
              )}
            </div>

            <div
              className="flex shrink-0 flex-col items-center gap-1"
              title={rank ? `${rank.name}${numeral ? ` ${numeral}` : ""}` : undefined}
            >
              {rank?.icon ? (
                <div className="border-brass-dim/60 bg-void flex h-11 w-11 items-center justify-center rounded-full border shadow-[0_0_10px_-2px_color-mix(in_oklab,var(--brass)_50%,transparent)]">
                  <Image
                    src={rank.icon}
                    alt={rank.name}
                    width={40}
                    height={40}
                    className="h-9 w-9 object-contain"
                  />
                </div>
              ) : null}
              {delta !== null ? (
                <span
                  className={cn(
                    "font-label text-[11px] tracking-widest",
                    delta > 0 ? "text-verdigris" : delta < 0 ? "text-oxblood" : "text-parchment-dim",
                  )}
                >
                  {delta > 0 ? "+" : ""}
                  {delta}
                </span>
              ) : (
                <span className="font-label text-parchment-dim text-[11px] tracking-widest">
                  {p.elo_before}
                </span>
              )}
            </div>
          </li>
        );
      })}
      {won ? (
        <li className={cn("font-label pt-2 text-center text-xs tracking-widest uppercase", style.text)}>
          Winner
        </li>
      ) : null}
    </ul>
  );
}
