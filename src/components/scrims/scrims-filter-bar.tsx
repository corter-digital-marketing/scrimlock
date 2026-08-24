"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { REGIONS } from "@/lib/regions";
import { RANKS, rankSelectItems } from "@/lib/ranks";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ScrimsFilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const region = searchParams.get("region") ?? "all";
  const minRank = searchParams.get("minRank") ?? "any";
  const maxRank = searchParams.get("maxRank") ?? "any";
  const after = searchParams.get("after") ?? "";

  function update(next: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(next)) {
      if (!value || value === "all" || value === "any") params.delete(key);
      else params.set(key, value);
    }
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <div className="frame-brass flex flex-col gap-4 rounded-sm bg-surface p-4 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="flex items-center gap-3">
        <Label className="font-label text-xs tracking-widest text-brass-dim uppercase">
          Region
        </Label>
        <Select
          value={region}
          items={{ all: "All regions", ...Object.fromEntries(REGIONS.map((r) => [r, r])) }}
          onValueChange={(v) => update({ region: v as string })}
        >
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

      <div className="flex items-center gap-3">
        <Label className="font-label text-xs tracking-widest text-brass-dim uppercase">
          Min rank
        </Label>
        <Select
          value={minRank}
          items={rankSelectItems({ value: "any", label: "Any" })}
          onValueChange={(v) => update({ minRank: v as string })}
        >
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
        <Select
          value={maxRank}
          items={rankSelectItems({ value: "any", label: "Any" })}
          onValueChange={(v) => update({ maxRank: v as string })}
        >
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
        <Label htmlFor="after" className="font-label text-xs tracking-widest text-brass-dim uppercase">
          From
        </Label>
        <Input
          id="after"
          type="date"
          value={after}
          onChange={(e) => update({ after: e.target.value })}
          className="w-40 border-brass-dim/60 bg-surface-2"
        />
      </div>
    </div>
  );
}
