"use client";

import { useActionState, useRef, useState } from "react";
import { createTeamAction, type TeamActionState } from "@/lib/actions/teams";
import { REGIONS } from "@/lib/regions";
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

const initialState: TeamActionState = null;

function fieldLabelClass() {
  return "font-label text-xs tracking-widest text-brass-dim uppercase";
}

export function CreateTeamForm() {
  const [state, formAction, pending] = useActionState(createTeamAction, initialState);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [logoName, setLogoName] = useState<string | null>(null);

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

      <div className="grid gap-5 sm:grid-cols-[1fr_140px]">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name" className={fieldLabelClass()}>
            Team name
          </Label>
          <Input
            id="name"
            name="name"
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
            placeholder="e.g. DDLK"
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
        <Select name="region">
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
          {logoName ?? "Choose logo"}
        </Button>
        <p className="font-body text-xs text-parchment-dim">
          PNG, JPEG, WebP, or GIF. 2MB max. Optional.
        </p>
      </div>

      <Button
        type="submit"
        disabled={pending}
        className="bg-brass text-primary-foreground hover:bg-brass/90 self-start"
      >
        {pending ? "Creating…" : "Create Team"}
      </Button>
    </form>
  );
}
