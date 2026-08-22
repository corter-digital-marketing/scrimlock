"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import {
  acceptResponseAction,
  declineResponseAction,
  type SimpleActionResult,
} from "@/lib/actions/scrims";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ScrimResponseEntry } from "@/lib/supabase/scrims";

export function ResponseList({
  scrimId,
  responses,
  canManage,
}: {
  scrimId: string;
  responses: ScrimResponseEntry[];
  canManage: boolean;
}) {
  const [pending, startTransition] = useTransition();

  function run(action: (fd: FormData) => Promise<SimpleActionResult>, responseId: string) {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("scrimId", scrimId);
      fd.set("responseId", responseId);
      const result = await action(fd);
      if (result?.error) toast.error(result.error);
    });
  }

  if (responses.length === 0) {
    return (
      <p className="font-body text-sm text-parchment-dim">No responses yet.</p>
    );
  }

  return (
    <ul className="flex flex-col divide-y divide-brass-dim/20">
      {responses.map((r) => (
        <li key={r.id} className="flex items-center gap-3 py-3">
          <Avatar className="border border-brass-dim/50">
            {r.profile?.avatar_url ? (
              <AvatarImage src={r.profile.avatar_url} alt="" />
            ) : null}
            <AvatarFallback className="font-label bg-surface-2 text-xs text-brass">
              {(r.profile?.display_name || r.profile?.username || "?")
                .slice(0, 2)
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <p className="font-body truncate text-sm text-parchment">
              {r.team ? `${r.team.name} [${r.team.tag}]` : (r.profile?.display_name ?? "Unknown")}
            </p>
            {r.message ? (
              <p className="font-body truncate text-xs text-parchment-dim">
                {r.message}
              </p>
            ) : null}
          </div>

          {r.status === "pending" && canManage ? (
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                disabled={pending}
                className="bg-verdigris text-primary-foreground hover:bg-verdigris/90"
                onClick={() => run(acceptResponseAction, r.id)}
              >
                Accept
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={pending}
                className="border-oxblood/50 text-oxblood hover:bg-oxblood/10"
                onClick={() => run(declineResponseAction, r.id)}
              >
                Decline
              </Button>
            </div>
          ) : (
            <span
              className={cn(
                "font-label text-[10px] tracking-widest uppercase",
                r.status === "accepted" && "text-verdigris",
                r.status === "declined" && "text-oxblood",
                r.status === "pending" && "text-parchment-dim",
              )}
            >
              {r.status}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
