"use client";

import { useActionState, useState } from "react";
import { createScrimAction, type ScrimActionState } from "@/lib/actions/scrims";
import { REGIONS } from "@/lib/regions";
import { RANKS } from "@/lib/ranks";
import type { TeamRow } from "@/lib/supabase/teams";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

function fieldLabelClass() {
  return "font-label text-xs tracking-widest text-brass-dim uppercase";
}

export function CreateScrimForm({ teams }: { teams: TeamRow[] }) {
  const [state, formAction, pending] = useActionState(createScrimAction, initialState);
  const [localDateTime, setLocalDateTime] = useState("");

  return (
    <form action={formAction} className="flex flex-col gap-6" noValidate>
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
          <Label className={fieldLabelClass()}>Post as</Label>
          <Select name="teamId" defaultValue="none">
            <SelectTrigger className="w-full border-brass-dim/60 bg-surface-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Solo (just you)</SelectItem>
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
        <Label className={fieldLabelClass()}>Region</Label>
        <Select name="region" required>
          <SelectTrigger className="w-full border-brass-dim/60 bg-surface-2">
            <SelectValue placeholder="Select a region" />
          </SelectTrigger>
          <SelectContent>
            {REGIONS.map((region) => (
              <SelectItem key={region} value={region}>
                {region}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label className={fieldLabelClass()}>Min opponent rank</Label>
          <Select name="minRankId" defaultValue="any">
            <SelectTrigger className="w-full border-brass-dim/60 bg-surface-2">
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

        <div className="flex flex-col gap-1.5">
          <Label className={fieldLabelClass()}>Max opponent rank</Label>
          <Select name="maxRankId" defaultValue="any">
            <SelectTrigger className="w-full border-brass-dim/60 bg-surface-2">
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
          {state?.fieldErrors?.maxRankId ? (
            <p className="text-xs text-oxblood">{state.fieldErrors.maxRankId[0]}</p>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="scheduledForLocal" className={fieldLabelClass()}>
          When (your local time)
        </Label>
        <Input
          id="scheduledForLocal"
          type="datetime-local"
          value={localDateTime}
          onChange={(e) => setLocalDateTime(e.target.value)}
          required
          className="border-brass-dim/60 bg-surface-2"
          aria-invalid={!!state?.fieldErrors?.scheduledFor}
        />
        {/* Converted to a UTC instant here — the server parses this, not the
            raw local string, so it's correct no matter where it runs. */}
        <input
          type="hidden"
          name="scheduledFor"
          value={localDateTime ? new Date(localDateTime).toISOString() : ""}
        />
        {state?.fieldErrors?.scheduledFor ? (
          <p className="text-xs text-oxblood">{state.fieldErrors.scheduledFor[0]}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="notes" className={fieldLabelClass()}>
          Notes
        </Label>
        <Textarea
          id="notes"
          name="notes"
          rows={3}
          maxLength={500}
          placeholder="Maps, format, number of games…"
          className="border-brass-dim/60 bg-surface-2"
          aria-invalid={!!state?.fieldErrors?.notes}
        />
        {state?.fieldErrors?.notes ? (
          <p className="text-xs text-oxblood">{state.fieldErrors.notes[0]}</p>
        ) : null}
      </div>

      <Button
        type="submit"
        disabled={pending}
        className="bg-brass text-primary-foreground hover:bg-brass/90 self-start"
      >
        {pending ? "Posting…" : "Post Scrim"}
      </Button>
    </form>
  );
}
