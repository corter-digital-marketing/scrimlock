"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import {
  confirmRegistrationAction,
  rejectRegistrationAction,
  type SimpleActionResult,
} from "@/lib/actions/tournaments";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { RegistrationEntry } from "@/lib/supabase/tournaments";

export function ManageRegistrations({
  tournamentId,
  registrations,
}: {
  tournamentId: string;
  registrations: RegistrationEntry[];
}) {
  const [pending, startTransition] = useTransition();

  function run(action: (fd: FormData) => Promise<SimpleActionResult>, registrationId: string) {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("tournamentId", tournamentId);
      fd.set("registrationId", registrationId);
      const result = await action(fd);
      if (result?.error) toast.error(result.error);
    });
  }

  if (registrations.length === 0) {
    return (
      <p className="font-body text-sm text-parchment-dim">No registrations yet.</p>
    );
  }

  return (
    <ul className="flex flex-col divide-y divide-brass-dim/20">
      {registrations.map((r) => (
        <li key={r.id} className="flex items-center justify-between gap-3 py-3">
          <div className="min-w-0 flex-1">
            <p className="font-body truncate text-sm text-parchment">
              {r.team ? `${r.team.name} [${r.team.tag}]` : (r.profile?.display_name ?? "Unknown")}
            </p>
            <p
              className={cn(
                "font-label text-[10px] tracking-widest uppercase",
                r.status === "confirmed" && "text-verdigris",
                r.status === "withdrawn" && "text-oxblood",
                r.status === "pending" && "text-parchment-dim",
              )}
            >
              {r.status}
            </p>
          </div>

          {r.status === "pending" ? (
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                disabled={pending}
                className="bg-verdigris text-primary-foreground hover:bg-verdigris/90"
                onClick={() => run(confirmRegistrationAction, r.id)}
              >
                Confirm
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={pending}
                className="border-oxblood/50 text-oxblood hover:bg-oxblood/10"
                onClick={() => run(rejectRegistrationAction, r.id)}
              >
                Reject
              </Button>
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
