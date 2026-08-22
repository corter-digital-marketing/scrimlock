"use client";

import Link from "next/link";
import { useActionState } from "react";
import { registerAction, type TournamentActionState } from "@/lib/actions/tournaments";
import type { TeamRow } from "@/lib/supabase/teams";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const initialState: TournamentActionState = null;

export function RegisterForm({
  tournamentId,
  entryType,
  teams,
}: {
  tournamentId: string;
  entryType: "solo" | "team";
  teams: TeamRow[];
}) {
  const [state, formAction, pending] = useActionState(registerAction, initialState);
  const blocked = entryType === "team" && teams.length === 0;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="tournamentId" value={tournamentId} />

      {state?.error ? (
        <p
          role="alert"
          className="rounded-sm border border-oxblood/50 bg-oxblood/10 px-3 py-2 text-sm text-parchment"
        >
          {state.error}
        </p>
      ) : null}

      {entryType === "team" ? (
        blocked ? (
          <p className="font-body text-sm text-parchment-dim">
            You need to own or captain a team to register.{" "}
            <Link href="/teams/new" className="text-brass hover:underline">
              Create one
            </Link>
            .
          </p>
        ) : (
          <div className="flex flex-col gap-1.5">
            <Label className="font-label text-xs tracking-widest text-brass-dim uppercase">
              Register as
            </Label>
            <Select name="teamId" required>
              <SelectTrigger className="w-full border-brass-dim/60 bg-surface-2">
                <SelectValue placeholder="Choose a team" />
              </SelectTrigger>
              <SelectContent>
                {teams.map((team) => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.name} [{team.tag}]
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )
      ) : null}

      <Button
        type="submit"
        disabled={pending || blocked}
        className="bg-brass text-primary-foreground hover:bg-brass/90 self-start"
      >
        {pending ? "Registering…" : "Register"}
      </Button>
    </form>
  );
}
