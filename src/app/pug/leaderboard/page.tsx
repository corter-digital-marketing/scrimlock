import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Crown, Medal, Trophy } from "lucide-react";
import { getPugLeaderboard } from "@/lib/supabase/pug-leaderboard";
import { pugEloToRank } from "@/lib/pug-elo";
import { getRankById } from "@/lib/ranks";
import { RankBadge } from "@/components/site/rank-badge";
import { DecoDivider } from "@/components/site/deco-divider";
import { SigilMark } from "@/components/site/sigil-mark";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "PUG Leaderboard" };
export const dynamic = "force-dynamic";

const POSITION_STYLE: Record<number, { icon: typeof Crown; className: string }> = {
  1: { icon: Crown, className: "text-brass text-glow-brass" },
  2: { icon: Medal, className: "text-parchment" },
  3: { icon: Medal, className: "text-verdigris" },
};

function PositionMarker({ position }: { position: number }) {
  const style = POSITION_STYLE[position];
  if (style) {
    const Icon = style.icon;
    return (
      <div className={cn("flex w-9 shrink-0 flex-col items-center", style.className)}>
        <Icon className="h-5 w-5" strokeWidth={1.5} />
        <span className="font-label text-[9px] tracking-widest">{position}</span>
      </div>
    );
  }
  return (
    <div className="font-display text-parchment-dim w-9 shrink-0 text-center text-sm">
      {position}
    </div>
  );
}

export default async function PugLeaderboardPage() {
  const entries = await getPugLeaderboard(50);

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <Link
        href="/pug"
        className="font-label text-parchment-dim hover:text-brass mb-8 inline-flex items-center gap-1.5 text-xs tracking-widest uppercase transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to PUG
      </Link>

      <div className="deco-corners relative overflow-hidden text-center">
        <SigilMark
          aria-hidden="true"
          className="text-brass pointer-events-none absolute top-1/2 left-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 opacity-[0.05]"
        />
        <div className="relative">
          <Trophy className="text-brass mx-auto h-9 w-9" strokeWidth={1.25} />
          <p className="font-label text-verdigris mt-3 text-xs tracking-[0.35em] uppercase">
            PUG Scrims
          </p>
          <h1 className="font-display text-parchment mt-2 text-4xl">Leaderboard</h1>
          <p className="font-body text-parchment-dim mx-auto mt-4 max-w-md">
            Ranked by ELO. You need at least one finished match to appear.
          </p>
        </div>
      </div>

      <DecoDivider className="mt-10" />

      {entries.length === 0 ? (
        <div className="frame-brass bg-surface mt-8 rounded-sm px-6 py-16 text-center">
          <p className="font-body text-parchment-dim">
            Nobody&apos;s finished a PUG match yet — be the first.
          </p>
          <Link
            href="/pug"
            className="font-label text-brass mt-4 inline-block text-xs tracking-widest uppercase hover:underline"
          >
            Find a Match &rarr;
          </Link>
        </div>
      ) : (
        <ol className="frame-brass bg-surface divide-brass-dim/15 mt-8 divide-y rounded-sm">
          {entries.map((entry, i) => {
            const position = i + 1;
            const pugRank = pugEloToRank(entry.profile.pug_elo);
            const rank = getRankById(pugRank.rankId);
            return (
              <li
                key={entry.profile.id}
                className={cn(
                  "flex items-center gap-4 px-5 py-4 sm:px-8",
                  position <= 3 && "bg-void/30",
                )}
              >
                <PositionMarker position={position} />

                <Avatar className="border-brass-dim/50 h-11 w-11 shrink-0 border">
                  {entry.profile.avatar_url ? (
                    <AvatarImage src={entry.profile.avatar_url} alt="" />
                  ) : null}
                  <AvatarFallback className="font-label bg-surface-2 text-brass text-xs">
                    {(entry.profile.display_name || entry.profile.username)
                      .slice(0, 2)
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1">
                  <Link
                    href={`/profile/${entry.profile.username}`}
                    className="font-display text-parchment hover:text-brass block truncate text-base transition-colors"
                  >
                    {entry.profile.display_name}
                  </Link>
                  <p className="font-label text-parchment-dim text-[10px] tracking-widest uppercase">
                    @{entry.profile.username} &middot; {entry.matchesPlayed} match
                    {entry.matchesPlayed === 1 ? "" : "es"}
                  </p>
                </div>

                {rank ? (
                  <RankBadge
                    rankName={rank.name}
                    iconSrc={rank.icon}
                    subrank={pugRank.subrank}
                    size="sm"
                    className="hidden shrink-0 sm:flex"
                  />
                ) : null}

                <div className="shrink-0 text-right">
                  <p className="font-display text-brass text-xl">{entry.profile.pug_elo}</p>
                  <p className="font-label text-parchment-dim text-[9px] tracking-widest uppercase">
                    ELO
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
