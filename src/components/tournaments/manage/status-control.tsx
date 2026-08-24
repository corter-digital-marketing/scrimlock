"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { setTournamentStatusAction } from "@/lib/actions/tournaments";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TournamentStatus } from "@/lib/supabase/database.types";

const STATUSES: { value: TournamentStatus; label: string }[] = [
  { value: "draft", label: "Draft (hidden)" },
  { value: "open", label: "Open for registration" },
  { value: "closed", label: "Closed" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
];

export function StatusControl({
  tournamentId,
  status,
}: {
  tournamentId: string;
  status: TournamentStatus;
}) {
  const [pending, startTransition] = useTransition();

  function change(value: TournamentStatus | null) {
    if (!value) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.set("tournamentId", tournamentId);
      fd.set("status", value);
      const result = await setTournamentStatusAction(fd);
      if (result?.error) toast.error(result.error);
    });
  }

  return (
    <Select
      value={status}
      items={Object.fromEntries(STATUSES.map((s) => [s.value, s.label]))}
      onValueChange={change}
      disabled={pending}
    >
      <SelectTrigger className="w-56 border-brass-dim/60 bg-surface-2">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {STATUSES.map((s) => (
          <SelectItem key={s.value} value={s.value}>
            {s.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
