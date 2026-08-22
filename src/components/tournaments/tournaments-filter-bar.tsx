"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
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

const STATUSES = [
  { value: "open", label: "Open" },
  { value: "closed", label: "Closed" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
];

export function TournamentsFilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const region = searchParams.get("region") ?? "all";
  const status = searchParams.get("status") ?? "all";
  const minRank = searchParams.get("minRank") ?? "any";
  const maxRank = searchParams.get("maxRank") ?? "any";

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

      <div className="flex items-center gap-3">
        <Label className="font-label text-xs tracking-widest text-brass-dim uppercase">
          Status
        </Label>
        <Select value={status} onValueChange={(v) => update({ status: v as string })}>
          <SelectTrigger className="w-40 border-brass-dim/60 bg-surface-2">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any status</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

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
    </div>
  );
}
