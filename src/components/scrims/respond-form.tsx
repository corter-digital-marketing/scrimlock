"use client";

import { useActionState } from "react";
import { respondToScrimAction, type ScrimActionState } from "@/lib/actions/scrims";
import type { TeamRow } from "@/lib/supabase/teams";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const initialState: ScrimActionState = null;

export function RespondForm({
  scrimId,
  teams,
}: {
  scrimId: string;
  teams: TeamRow[];
}) {
  const [state, formAction, pending] = useActionState(respondToScrimAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="scrimId" value={scrimId} />

      {state?.error ? (
        <p
          role="alert"
          className="rounded-sm border border-oxblood/50 bg-oxblood/10 px-3 py-2 text-sm text-parchment"
        >
          {state.error}
        </p>
      ) : null}

      {teams.length > 0 ? (
        <div className="flex flex-col gap-1.5">
          <Label className="font-label text-xs tracking-widest text-brass-dim uppercase">
            Respond as
          </Label>
          <Select name="teamId" defaultValue="none">
            <SelectTrigger className="w-full border-brass-dim/60 bg-surface-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Just you</SelectItem>
              {teams.map((team) => (
                <SelectItem key={team.id} value={team.id}>
                  {team.name} [{team.tag}]
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="message" className="font-label text-xs tracking-widest text-brass-dim uppercase">
          Message (optional)
        </Label>
        <Textarea
          id="message"
          name="message"
          rows={2}
          maxLength={300}
          placeholder="Availability, comms, anything the poster should know…"
          className="border-brass-dim/60 bg-surface-2"
        />
        {state?.fieldErrors?.message ? (
          <p className="text-xs text-oxblood">{state.fieldErrors.message[0]}</p>
        ) : null}
      </div>

      <Button
        type="submit"
        disabled={pending}
        className="bg-brass text-primary-foreground hover:bg-brass/90 self-start"
      >
        {pending ? "Sending…" : "Respond"}
      </Button>
    </form>
  );
}
