"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { REGIONS } from "@/lib/regions";
import { RANKS } from "@/lib/ranks";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import type { HeroOption } from "@/lib/supabase/heroes";

export function LftFilterBar({ heroes }: { heroes: HeroOption[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const view = searchParams.get("view") === "teams" ? "teams" : "players";
  const region = searchParams.get("region") ?? "all";
  const minRank = searchParams.get("minRank") ?? "any";
  const maxRank = searchParams.get("maxRank") ?? "any";
  const hero = searchParams.get("hero") ?? "all";

  function update(next: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(next)) {
      if (!value || value === "all" || value === "any") params.delete(key);
      else params.set(key, value);
    }
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  function setView(v: string) {
    // Switching views clears filters that don't apply to the other one.
    const params = new URLSearchParams();
    params.set("view", v);
    const region2 = searchParams.get("region");
    if (region2) params.set("region", region2);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-col gap-4">
      <div
        role="tablist"
        aria-label="LFT view"
        className="inline-flex w-fit rounded-sm border border-brass-dim/50 bg-surface p-1"
      >
        {(["players", "teams"] as const).map((v) => (
          <button
            key={v}
            type="button"
            role="tab"
            aria-selected={view === v}
            onClick={() => setView(v)}
            className={cn(
              "font-display rounded-sm px-4 py-1.5 text-sm tracking-wide uppercase transition-weighted",
              view === v
                ? "bg-brass text-primary-foreground"
                : "text-parchment-dim hover:text-parchment",
            )}
          >
            {v === "players" ? "Players" : "Teams"}
          </button>
        ))}
      </div>

      <div className="frame-brass flex flex-col gap-4 rounded-sm bg-surface p-4 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="flex items-center gap-3">
          <Label className="font-label text-xs tracking-widest text-brass-dim uppercase">
            Region
          </Label>
          <Select value={region} onValueChange={(v) => update({ region: v as string })}>
            <SelectTrigger className="w-36 border-brass-dim/60 bg-surface-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All regions</SelectItem>
              {REGIONS.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {view === "players" ? (
          <>
            <div className="flex items-center gap-3">
              <Label className="font-label text-xs tracking-widest text-brass-dim uppercase">
                Min rank
              </Label>
              <Select value={minRank} onValueChange={(v) => update({ minRank: v as string })}>
                <SelectTrigger className="w-36 border-brass-dim/60 bg-surface-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any</SelectItem>
                  {RANKS.map((r) => (
                    <SelectItem key={r.id} value={String(r.id)}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-3">
              <Label className="font-label text-xs tracking-widest text-brass-dim uppercase">
                Max rank
              </Label>
              <Select value={maxRank} onValueChange={(v) => update({ maxRank: v as string })}>
                <SelectTrigger className="w-36 border-brass-dim/60 bg-surface-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any</SelectItem>
                  {RANKS.map((r) => (
                    <SelectItem key={r.id} value={String(r.id)}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-3">
              <Label className="font-label text-xs tracking-widest text-brass-dim uppercase">
                Hero
              </Label>
              <Select value={hero} onValueChange={(v) => update({ hero: v as string })}>
                <SelectTrigger className="w-40 border-brass-dim/60 bg-surface-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any hero</SelectItem>
                  {heroes.map((h) => (
                    <SelectItem key={h.id} value={h.id}>
                      {h.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
