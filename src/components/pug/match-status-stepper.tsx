import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Database } from "@/lib/supabase/database.types";

type MatchStatus = Database["public"]["Tables"]["pug_matches"]["Row"]["status"];

const STEPS: { status: MatchStatus; label: string }[] = [
  { status: "lobby_pending", label: "Lobby" },
  { status: "in_progress", label: "In Progress" },
  { status: "completed", label: "Completed" },
];

export function MatchStatusStepper({ status }: { status: MatchStatus }) {
  const activeIndex = STEPS.findIndex((s) => s.status === status);

  return (
    <ol className="mx-auto flex max-w-md items-center">
      {STEPS.map((step, i) => {
        const done = i < activeIndex;
        const current = i === activeIndex;
        return (
          <li key={step.status} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full border transition-weighted",
                  done && "border-brass bg-brass text-primary-foreground",
                  current &&
                    "border-brass bg-void text-brass shadow-[0_0_10px_1px_color-mix(in_oklab,var(--brass)_60%,transparent)]",
                  !done && !current && "border-brass-dim/40 bg-void text-parchment-dim",
                )}
              >
                {done ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                )}
              </div>
              <span
                className={cn(
                  "font-label text-[9px] tracking-widest uppercase",
                  current || done ? "text-parchment" : "text-parchment-dim",
                )}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 ? (
              <span
                aria-hidden="true"
                className={cn(
                  "mx-2 mb-4 h-px flex-1",
                  done ? "bg-brass" : "bg-brass-dim/30",
                )}
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
