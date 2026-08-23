"use client";

import { cn } from "@/lib/utils";
import { PUG_REGIONS, PUG_REGION_LABELS, type PugRegion } from "@/lib/pug-regions";

/**
 * Just two regions, so a dropdown is the wrong control — a segmented
 * toggle reads instantly and shows both choices (and, via `counts`,
 * which one actually has people in it) at a glance.
 */
export function RegionToggle({
  value,
  onChange,
  counts,
  disabled,
}: {
  value: PugRegion | "";
  onChange: (region: PugRegion) => void;
  counts?: Partial<Record<PugRegion, number>>;
  disabled?: boolean;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Region"
      className="frame-brass grid grid-cols-2 gap-1 rounded-sm bg-surface-2 p-1"
    >
      {PUG_REGIONS.map((region) => {
        const active = value === region;
        const count = counts?.[region];
        return (
          <button
            key={region}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled}
            onClick={() => onChange(region)}
            className={cn(
              "transition-weighted focus-visible:ring-brass relative flex flex-col items-center gap-0.5 rounded-sm px-5 py-2.5 focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
              active
                ? "bg-brass text-primary-foreground shadow-[0_0_16px_-2px_color-mix(in_oklab,var(--brass)_60%,transparent)]"
                : "text-parchment-dim hover:bg-void/40 hover:text-parchment",
            )}
          >
            <span className="font-display text-base tracking-wide">{region}</span>
            <span
              className={cn(
                "font-label text-[9px] tracking-widest uppercase",
                active ? "text-primary-foreground/70" : "text-parchment-dim/70",
              )}
            >
              {count !== undefined ? `${count} waiting` : PUG_REGION_LABELS[region]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
