"use client";

import { useActionState, useRef, useState } from "react";
import type { TournamentActionState } from "@/lib/actions/tournaments";
import { REGIONS } from "@/lib/regions";
import { RANKS, rankSelectItems } from "@/lib/ranks";
import type { TournamentRow } from "@/lib/supabase/tournaments";
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

const initialState: TournamentActionState = null;

function fieldLabelClass() {
  return "font-label text-xs tracking-widest text-brass-dim uppercase";
}

/** Converts a datetime-local's naive string to a UTC ISO instant using the
 * *browser's* timezone, and keeps a hidden input carrying that value in
 * sync — so the server (which may run anywhere) parses an unambiguous
 * instant instead of guessing whose timezone a naive string is in. */
function useUtcSyncedDateTime(initial?: string) {
  const [local, setLocal] = useState(() =>
    initial ? toDatetimeLocalValue(initial) : "",
  );
  return {
    local,
    setLocal,
    iso: local ? new Date(local).toISOString() : "",
  };
}

function toDatetimeLocalValue(isoString: string) {
  const d = new Date(isoString);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function TournamentForm({
  action,
  tournament,
  submitLabel,
}: {
  action: (state: TournamentActionState, formData: FormData) => Promise<TournamentActionState>;
  tournament?: TournamentRow;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [bannerName, setBannerName] = useState<string | null>(null);
  const starts = useUtcSyncedDateTime(tournament?.starts_at);
  const closes = useUtcSyncedDateTime(tournament?.registration_closes_at);

  return (
    <form action={formAction} className="flex flex-col gap-6" noValidate>
      {tournament ? (
        <input type="hidden" name="tournamentId" value={tournament.id} />
      ) : null}

      {state?.error ? (
        <p
          role="alert"
          className="rounded-sm border border-oxblood/50 bg-oxblood/10 px-3 py-2 text-sm text-parchment"
        >
          {state.error}
        </p>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="title" className={fieldLabelClass()}>
          Title
        </Label>
        <Input
          id="title"
          name="title"
          defaultValue={tournament?.title}
          required
          className="border-brass-dim/60 bg-surface-2"
          aria-invalid={!!state?.fieldErrors?.title}
        />
        {state?.fieldErrors?.title ? (
          <p className="text-xs text-oxblood">{state.fieldErrors.title[0]}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description" className={fieldLabelClass()}>
          Description
        </Label>
        <Textarea
          id="description"
          name="description"
          rows={4}
          maxLength={2000}
          defaultValue={tournament?.description}
          className="border-brass-dim/60 bg-surface-2"
          aria-invalid={!!state?.fieldErrors?.description}
        />
        {state?.fieldErrors?.description ? (
          <p className="text-xs text-oxblood">{state.fieldErrors.description[0]}</p>
        ) : null}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="format" className={fieldLabelClass()}>
            Format
          </Label>
          <Input
            id="format"
            name="format"
            placeholder="e.g. Single Elimination"
            defaultValue={tournament?.format ?? ""}
            className="border-brass-dim/60 bg-surface-2"
          />
          <p className="font-body text-xs text-parchment-dim">
            Informational only — brackets aren&apos;t automated yet.
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="prizePool" className={fieldLabelClass()}>
            Prize pool
          </Label>
          <Input
            id="prizePool"
            name="prizePool"
            placeholder="e.g. $500"
            defaultValue={tournament?.prize_pool ?? ""}
            className="border-brass-dim/60 bg-surface-2"
          />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label className={fieldLabelClass()}>Region</Label>
          <Select name="region" defaultValue={tournament?.region} required>
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

        <div className="flex flex-col gap-1.5">
          <Label className={fieldLabelClass()}>Entry type</Label>
          <Select
            name="entryType"
            defaultValue={tournament?.entry_type ?? "solo"}
            items={{ solo: "Solo", team: "Team" }}
          >
            <SelectTrigger className="w-full border-brass-dim/60 bg-surface-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="solo">Solo</SelectItem>
              <SelectItem value="team">Team</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="maxParticipants" className={fieldLabelClass()}>
          Max participants
        </Label>
        <Input
          id="maxParticipants"
          name="maxParticipants"
          type="number"
          min={2}
          max={256}
          defaultValue={tournament?.max_participants ?? 16}
          required
          className="w-32 border-brass-dim/60 bg-surface-2"
          aria-invalid={!!state?.fieldErrors?.maxParticipants}
        />
        {state?.fieldErrors?.maxParticipants ? (
          <p className="text-xs text-oxblood">{state.fieldErrors.maxParticipants[0]}</p>
        ) : null}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label className={fieldLabelClass()}>Min rank (optional gate)</Label>
          <Select
            name="minRankId"
            defaultValue={tournament?.min_rank_id != null ? String(tournament.min_rank_id) : "any"}
            items={rankSelectItems({ value: "any", label: "Any" })}
          >
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
          <Label className={fieldLabelClass()}>Max rank (optional gate)</Label>
          <Select
            name="maxRankId"
            defaultValue={tournament?.max_rank_id != null ? String(tournament.max_rank_id) : "any"}
            items={rankSelectItems({ value: "any", label: "Any" })}
          >
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

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="startsAtLocal" className={fieldLabelClass()}>
            Starts (your local time)
          </Label>
          <Input
            id="startsAtLocal"
            type="datetime-local"
            value={starts.local}
            onChange={(e) => starts.setLocal(e.target.value)}
            required
            className="border-brass-dim/60 bg-surface-2"
            aria-invalid={!!state?.fieldErrors?.startsAt}
          />
          <input type="hidden" name="startsAt" value={starts.iso} />
          {state?.fieldErrors?.startsAt ? (
            <p className="text-xs text-oxblood">{state.fieldErrors.startsAt[0]}</p>
          ) : null}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="registrationClosesAtLocal" className={fieldLabelClass()}>
            Registration closes
          </Label>
          <Input
            id="registrationClosesAtLocal"
            type="datetime-local"
            value={closes.local}
            onChange={(e) => closes.setLocal(e.target.value)}
            required
            className="border-brass-dim/60 bg-surface-2"
            aria-invalid={!!state?.fieldErrors?.registrationClosesAt}
          />
          <input type="hidden" name="registrationClosesAt" value={closes.iso} />
          {state?.fieldErrors?.registrationClosesAt ? (
            <p className="text-xs text-oxblood">
              {state.fieldErrors.registrationClosesAt[0]}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className={fieldLabelClass()}>Banner</Label>
        <input
          ref={fileInputRef}
          type="file"
          name="banner"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="hidden"
          onChange={(e) => setBannerName(e.target.files?.[0]?.name ?? null)}
        />
        <Button
          type="button"
          variant="outline"
          className="w-fit border-brass-dim"
          onClick={() => fileInputRef.current?.click()}
        >
          {bannerName ?? (tournament?.banner_url ? "Replace banner" : "Choose banner")}
        </Button>
        <p className="font-body text-xs text-parchment-dim">
          PNG, JPEG, WebP, or GIF. 4MB max. Optional.
        </p>
      </div>

      <Button
        type="submit"
        disabled={pending}
        className="bg-brass text-primary-foreground hover:bg-brass/90 self-start"
      >
        {pending ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}
