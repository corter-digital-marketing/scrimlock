import { cn } from "@/lib/utils";
import { subrankToRoman } from "@/lib/ranks";

/**
 * An occult medallion: brass ring, verdigris fill, roman-numeral subrank
 * centered — the styled treatment for a rank + subrank pair (§6).
 */
export function RankBadge({
  rankName,
  subrank,
  size = "md",
  className,
}: {
  rankName: string;
  subrank?: number | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const numeral = subrankToRoman(subrank);
  const dims =
    size === "lg" ? "h-20 w-20" : size === "sm" ? "h-9 w-9" : "h-12 w-12";
  const numeralSize =
    size === "lg" ? "text-xl" : size === "sm" ? "text-[10px]" : "text-sm";

  return (
    <div className={cn("flex flex-col items-center gap-1.5", className)}>
      <div
        className={cn(
          "relative flex items-center justify-center rounded-full",
          dims,
        )}
        style={{
          background:
            "radial-gradient(circle at 35% 30%, color-mix(in oklab, var(--verdigris) 65%, var(--bg-surface)), var(--verdigris-dim) 70%)",
          boxShadow:
            "0 0 0 2px var(--brass), 0 0 0 3px color-mix(in oklab, var(--brass-dim) 70%, transparent), inset 0 1px 3px color-mix(in oklab, black 40%, transparent)",
        }}
      >
        {numeral ? (
          <span
            className={cn(
              "font-display font-semibold text-parchment",
              numeralSize,
            )}
          >
            {numeral}
          </span>
        ) : (
          <span className="h-2 w-2 rounded-full bg-parchment/70" />
        )}
      </div>
      <span className="font-label text-center text-[10px] tracking-widest text-parchment-dim uppercase">
        {rankName}
      </span>
    </div>
  );
}
