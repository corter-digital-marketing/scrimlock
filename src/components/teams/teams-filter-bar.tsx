"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { REGIONS } from "@/lib/regions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export function TeamsFilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const region = searchParams.get("region") ?? "all";
  const recruitingOnly = searchParams.get("recruiting") === "1";

  function update(next: { region?: string; recruiting?: boolean }) {
    const params = new URLSearchParams(searchParams.toString());

    if (next.region !== undefined) {
      if (next.region === "all") params.delete("region");
      else params.set("region", next.region);
    }
    if (next.recruiting !== undefined) {
      if (next.recruiting) params.set("recruiting", "1");
      else params.delete("recruiting");
    }

    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <div className="frame-brass flex flex-col gap-4 rounded-sm bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <Label className="font-label text-xs tracking-widest text-brass-dim uppercase">
          Region
        </Label>
        <Select
          value={region}
          items={{ all: "All regions", ...Object.fromEntries(REGIONS.map((r) => [r, r])) }}
          onValueChange={(v) => update({ region: v as string })}
        >
          <SelectTrigger className="w-40 border-brass-dim/60 bg-surface-2">
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

      <div className="flex items-center gap-2.5">
        <Switch
          id="recruiting-filter"
          checked={recruitingOnly}
          onCheckedChange={(checked) => update({ recruiting: checked })}
        />
        <Label
          htmlFor="recruiting-filter"
          className="font-label text-xs tracking-widest text-parchment uppercase"
        >
          Recruiting only
        </Label>
      </div>
    </div>
  );
}
