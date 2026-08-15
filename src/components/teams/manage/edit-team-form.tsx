"use client";

import { useActionState, useRef, useState } from "react";
import { updateTeamAction, type TeamActionState } from "@/lib/actions/teams";
import { REGIONS } from "@/lib/regions";
import type { TeamRow } from "@/lib/supabase/teams";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const initialState: TeamActionState = null;

function fieldLabelClass() {
  return "font-label text-xs tracking-widest text-brass-dim uppercase";
}

export function EditTeamForm({ team }: { team: TeamRow }) {
  const [state, formAction, pending] = useActionState(updateTeamAction, initialState);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [logoName, setLogoName] = useState<string | null>(null);
  const [isRecruiting, setIsRecruiting] = useState(team.is_recruiting);

  return (
    <form action={formAction} className="flex flex-col gap-6" noValidate>
      <input type="hidden" name="teamId" value={team.id} />

      {state?.error ? (
        <p
          role="alert"
          className="rounded-sm border border-oxblood/50 bg-oxblood/10 px-3 py-2 text-sm text-parchment"
        >
          {state.error}
        </p>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-[1fr_140px]">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name" className={fieldLabelClass()}>
            Team name
          </Label>
          <Input
            id="name"
            name="name"
            defaultValue={team.name}
            required
            className="border-brass-dim/60 bg-surface-2"
            aria-invalid={!!state?.fieldErrors?.name}
          />
          {state?.fieldErrors?.name ? (
            <p className="text-xs text-oxblood">{state.fieldErrors.name[0]}</p>
          ) : null}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="tag" className={fieldLabelClass()}>
            Tag
          </Label>
          <Input
            id="tag"
            name="tag"
            defaultValue={team.tag}
            maxLength={5}
            required
            className="border-brass-dim/60 bg-surface-2 uppercase"
            aria-invalid={!!state?.fieldErrors?.tag}
          />
          {state?.fieldErrors?.tag ? (
            <p className="text-xs text-oxblood">{state.fieldErrors.tag[0]}</p>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className={fieldLabelClass()}>Region</Label>
        <Select name="region" defaultValue={team.region ?? undefined}>
          <SelectTrigger className="w-full border-brass-dim/60 bg-surface-2">
            <SelectValue placeholder="Not set" />
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
        <Label htmlFor="description" className={fieldLabelClass()}>
          Description
        </Label>
        <Textarea
          id="description"
          name="description"
          rows={3}
          maxLength={500}
          defaultValue={team.description ?? ""}
          className="border-brass-dim/60 bg-surface-2"
          aria-invalid={!!state?.fieldErrors?.description}
        />
        {state?.fieldErrors?.description ? (
          <p className="text-xs text-oxblood">{state.fieldErrors.description[0]}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className={fieldLabelClass()}>Logo</Label>
        <input
          ref={fileInputRef}
          type="file"
          name="logo"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="hidden"
          onChange={(e) => setLogoName(e.target.files?.[0]?.name ?? null)}
        />
        <Button
          type="button"
          variant="outline"
          className="w-fit border-brass-dim"
          onClick={() => fileInputRef.current?.click()}
        >
          {logoName ?? "Replace logo"}
        </Button>
      </div>

      <section className="frame-brass flex flex-col gap-4 rounded-sm bg-surface-2 px-4 py-3.5">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="isRecruiting" className="font-display text-sm text-parchment">
              Recruiting
            </Label>
            <p className="font-body mt-0.5 text-xs text-parchment-dim">
              Surfaces this team on the LFT tab.
            </p>
          </div>
          <Switch
            id="isRecruiting"
            name="isRecruiting"
            checked={isRecruiting}
            onCheckedChange={setIsRecruiting}
          />
        </div>

        {isRecruiting ? (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="recruitingNote" className={fieldLabelClass()}>
              Recruiting note
            </Label>
            <Input
              id="recruitingNote"
              name="recruitingNote"
              placeholder="e.g. need 2, Emissary+, NA"
              maxLength={140}
              defaultValue={team.recruiting_note ?? ""}
              className="border-brass-dim/60 bg-surface"
              aria-invalid={!!state?.fieldErrors?.recruitingNote}
            />
            {state?.fieldErrors?.recruitingNote ? (
              <p className="text-xs text-oxblood">
                {state.fieldErrors.recruitingNote[0]}
              </p>
            ) : null}
          </div>
        ) : null}
      </section>

      <Button
        type="submit"
        disabled={pending}
        className="bg-brass text-primary-foreground hover:bg-brass/90 self-start"
      >
        {pending ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
