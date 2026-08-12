import Image from "next/image";
import { cn } from "@/lib/utils";
import { subrankToRoman } from "@/lib/ranks";

/**
 * The official rank emblem, with the roman-numeral subrank as a small
 * chip at the corner — the styled treatment for a rank + subrank pair.
 */
export function RankBadge({
  rankName,
  iconSrc,
  subrank,
  size = "md",
  className,
}: {
  rankName: string;
  iconSrc?: string;
  subrank?: number | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const numeral = subrankToRoman(subrank);
  const dims =
    size === "lg" ? "h-20 w-20" : size === "sm" ? "h-9 w-9" : "h-12 w-12";
  const chipSize =
    size === "lg"
      ? "h-6 min-w-6 px-1 text-xs"
      : size === "sm"
        ? "h-4 min-w-4 px-0.5 text-[9px]"
        : "h-5 min-w-5 px-1 text-[10px]";

  return (
    <div className={cn("flex flex-col items-center gap-1.5", className)}>
      <div className={cn("relative shrink-0", dims)}>
        {iconSrc ? (
          <Image
            src={iconSrc}
            alt=""
            width={96}
            height={96}
            className="h-full w-full object-contain"
          />
        ) : (
          <span className="absolute inset-0 m-auto h-2 w-2 rounded-full bg-parchment/70" />
        )}
        {numeral ? (
          <span
            className={cn(
              "font-display absolute -right-1 -bottom-1 flex items-center justify-center rounded-full border border-brass bg-void font-semibold text-brass",
              chipSize,
            )}
          >
            {numeral}
          </span>
        ) : null}
      </div>
      <span className="font-label text-center text-[10px] tracking-widest text-parchment-dim uppercase">
        {rankName}
      </span>
    </div>
  );
}
