import { cn } from "@/lib/utils";
import { MATCH_SIZE, TEAM_SIZE } from "@/lib/pug-matchmaking";

/**
 * The 12 match slots as two ranks of 6, filling left-to-right — a glance
 * at how close the region is to popping a match, instead of just a
 * number. Purely presentational: `filled` is a count, not real seats.
 */
export function QueueSlots({ filled }: { filled: number }) {
  const clamped = Math.min(filled, MATCH_SIZE);

  return (
    <div className="flex flex-col items-center gap-2">
      {[0, 1].map((row) => (
        <div key={row} className="flex gap-1.5">
          {Array.from({ length: TEAM_SIZE }).map((_, col) => {
            const index = row * TEAM_SIZE + col;
            const lit = index < clamped;
            return (
              <span
                key={col}
                aria-hidden="true"
                className={cn(
                  "transition-weighted h-3 w-3 rotate-45 border",
                  lit
                    ? "border-brass bg-brass shadow-[0_0_8px_1px_color-mix(in_oklab,var(--brass)_65%,transparent)]"
                    : "border-brass-dim/40 bg-transparent",
                )}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
