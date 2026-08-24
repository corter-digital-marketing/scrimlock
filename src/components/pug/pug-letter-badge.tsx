import { cn } from "@/lib/utils";
import { pugEloToLetterRank } from "@/lib/pug-elo";

const SIZES = {
  sm: "h-9 w-9 text-base",
  md: "h-11 w-11 text-lg",
  lg: "h-20 w-20 text-3xl",
} as const;

/** The letter-grade PUG rank badge (S/A/B/C/D/Unranked), color-coded,
 * used everywhere PUG ELO shows up — homepage ladder, leaderboard,
 * match rosters. */
export function PugLetterBadge({
  elo,
  size = "md",
  className,
}: {
  elo: number;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const rank = pugEloToLetterRank(elo);
  const isLetter = rank.letter !== "Unranked";

  return (
    <div
      title={rank.letter}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full border-2 font-display",
        SIZES[size],
        className,
      )}
      style={{
        color: rank.color,
        borderColor: rank.color,
        backgroundColor: `color-mix(in oklab, ${rank.color} 14%, transparent)`,
        boxShadow: `0 0 14px -3px color-mix(in oklab, ${rank.color} 65%, transparent)`,
      }}
    >
      {isLetter ? rank.letter : "—"}
    </div>
  );
}
