"use client";

import { useActionState, useMemo, useRef, useState } from "react";
import { updateProfileAction, type ProfileActionState } from "@/lib/actions/profile";
import { RANKS, subrankToRoman, rankSelectItems, subrankSelectItems } from "@/lib/ranks";
import { REGIONS } from "@/lib/regions";
import type { ProfileRow } from "@/lib/supabase/profiles";
import type { HeroOption } from "@/lib/supabase/heroes";
import { HeroMultiSelect } from "@/components/profile/hero-multiselect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const initialState: ProfileActionState = null;

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return <p className="text-xs text-oxblood">{messages[0]}</p>;
}

function fieldLabelClass() {
  return "font-label text-xs tracking-widest text-brass-dim uppercase";
}

export function ProfileSettingsForm({
  profile,
  email,
  heroes,
}: {
  profile: ProfileRow;
  email: string;
  heroes: HeroOption[];
}) {
  const [state, formAction, pending] = useActionState(
    updateProfileAction,
    initialState,
  );

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    profile.avatar_url,
  );
  const [rankId, setRankId] = useState<string>(
    profile.rank_id != null ? String(profile.rank_id) : "none",
  );
  const [rankSubrank, setRankSubrank] = useState<string>(
    profile.rank_subrank != null ? String(profile.rank_subrank) : "none",
  );

  const timezones = useMemo(() => {
    try {
      return Intl.supportedValuesOf("timeZone");
    } catch {
      return [];
    }
  }, []);

  const showSubrank = rankId !== "none" && rankId !== "0";
  const initials = (profile.display_name || profile.username || "?")
    .slice(0, 2)
    .toUpperCase();

  return (
    <form action={formAction} className="flex flex-col gap-10">
      {state?.error ? (
        <p
          role="alert"
          className="rounded-sm border border-oxblood/50 bg-oxblood/10 px-3 py-2 text-sm text-parchment"
        >
          {state.error}
        </p>
      ) : null}

      {/* Avatar */}
      <section className="flex items-center gap-5">
        <Avatar className="h-20 w-20 border border-brass-dim">
          {avatarPreview ? <AvatarImage src={avatarPreview} alt="" /> : null}
          <AvatarFallback className="font-display bg-surface-2 text-2xl text-brass">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col gap-2">
          <input
            ref={fileInputRef}
            type="file"
            name="avatar"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) setAvatarPreview(URL.createObjectURL(file));
            }}
          />
          <Button
            type="button"
            variant="outline"
            className="border-brass-dim"
            onClick={() => fileInputRef.current?.click()}
          >
            Change avatar
          </Button>
          <p className="font-body text-xs text-parchment-dim">
            PNG, JPEG, WebP, or GIF. 2MB max.
          </p>
        </div>
      </section>

      {/* Basic info */}
      <section className="flex flex-col gap-5">
        <p className="font-label text-xs tracking-widest text-verdigris uppercase">
          Basic info
        </p>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="username" className={fieldLabelClass()}>
              Username
            </Label>
            <Input
              id="username"
              name="username"
              defaultValue={profile.username}
              required
              className="border-brass-dim/60 bg-surface-2"
              aria-invalid={!!state?.fieldErrors?.username}
            />
            <FieldError messages={state?.fieldErrors?.username} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="displayName" className={fieldLabelClass()}>
              Display name
            </Label>
            <Input
              id="displayName"
              name="displayName"
              defaultValue={profile.display_name}
              required
              className="border-brass-dim/60 bg-surface-2"
              aria-invalid={!!state?.fieldErrors?.displayName}
            />
            <FieldError messages={state?.fieldErrors?.displayName} />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className={fieldLabelClass()}>Email</Label>
          <Input
            value={email}
            disabled
            className="border-brass-dim/30 bg-surface-2 text-parchment-dim"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="bio" className={fieldLabelClass()}>
            Bio
          </Label>
          <Textarea
            id="bio"
            name="bio"
            rows={3}
            maxLength={500}
            defaultValue={profile.bio ?? ""}
            className="border-brass-dim/60 bg-surface-2"
            aria-invalid={!!state?.fieldErrors?.bio}
          />
          <FieldError messages={state?.fieldErrors?.bio} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="discordHandle" className={fieldLabelClass()}>
            Discord handle
          </Label>
          <Input
            id="discordHandle"
            name="discordHandle"
            placeholder="username"
            defaultValue={profile.discord_handle ?? ""}
            className="border-brass-dim/60 bg-surface-2"
            aria-invalid={!!state?.fieldErrors?.discordHandle}
          />
          <p className="font-body text-xs text-parchment-dim">
            Display only — Discord isn&apos;t used to sign in.
          </p>
          <FieldError messages={state?.fieldErrors?.discordHandle} />
        </div>
      </section>

      {/* Social links */}
      <section className="flex flex-col gap-5">
        <p className="font-label text-xs tracking-widest text-verdigris uppercase">
          Social links
        </p>

        <div className="grid gap-5 sm:grid-cols-2">
          {(
            [
              ["youtubeUrl", "YouTube", profile.youtube_url],
              ["twitchUrl", "Twitch", profile.twitch_url],
              ["statlockerUrl", "StatLocker", profile.statlocker_url],
              ["xUrl", "X", profile.x_url],
              ["instagramUrl", "Instagram", profile.instagram_url],
            ] as const
          ).map(([name, label, value]) => (
            <div key={name} className="flex flex-col gap-1.5">
              <Label htmlFor={name} className={fieldLabelClass()}>
                {label}
              </Label>
              <Input
                id={name}
                name={name}
                type="url"
                placeholder="https://…"
                defaultValue={value ?? ""}
                className="border-brass-dim/60 bg-surface-2"
                aria-invalid={!!state?.fieldErrors?.[name]}
              />
              <FieldError messages={state?.fieldErrors?.[name]} />
            </div>
          ))}
        </div>
      </section>

      {/* Region & timezone */}
      <section className="flex flex-col gap-5">
        <p className="font-label text-xs tracking-widest text-verdigris uppercase">
          Region &amp; timezone
        </p>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label className={fieldLabelClass()}>Region</Label>
            <Select name="region" defaultValue={profile.region ?? "none"} items={{ none: "Not set" }}>
              <SelectTrigger className="w-full border-brass-dim/60 bg-surface-2">
                <SelectValue placeholder="Not set" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Not set</SelectItem>
                {REGIONS.map((region) => (
                  <SelectItem key={region} value={region}>
                    {region}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="timezone" className={fieldLabelClass()}>
              Timezone
            </Label>
            <select
              id="timezone"
              name="timezone"
              defaultValue={profile.timezone ?? ""}
              className="h-9 rounded-sm border border-brass-dim/60 bg-surface-2 px-2.5 text-sm text-parchment"
            >
              <option value="">Not set</option>
              {timezones.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Rank */}
      <section className="flex flex-col gap-5">
        <p className="font-label text-xs tracking-widest text-verdigris uppercase">
          Rank
        </p>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label className={fieldLabelClass()}>Rank</Label>
            <Select
              name="rankId"
              value={rankId}
              items={rankSelectItems({ value: "none", label: "Not set" })}
              onValueChange={(v) => {
                setRankId(v as string);
                if (v === "none" || v === "0") setRankSubrank("none");
              }}
            >
              <SelectTrigger className="w-full border-brass-dim/60 bg-surface-2">
                <SelectValue placeholder="Not set" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Not set</SelectItem>
                {RANKS.map((rank) => (
                  <SelectItem key={rank.id} value={String(rank.id)}>
                    {rank.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className={fieldLabelClass()}>Subrank</Label>
            <Select
              name="rankSubrank"
              value={rankSubrank}
              items={subrankSelectItems({ value: "none", label: "Not set" })}
              onValueChange={(v) => setRankSubrank(v as string)}
              disabled={!showSubrank}
            >
              <SelectTrigger className="w-full border-brass-dim/60 bg-surface-2">
                <SelectValue placeholder="Not set" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Not set</SelectItem>
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {subrankToRoman(n)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError messages={state?.fieldErrors?.rankSubrank} />
          </div>
        </div>
      </section>

      {/* Preferred heroes */}
      <section className="flex flex-col gap-3">
        <div>
          <p className="font-label text-xs tracking-widest text-verdigris uppercase">
            Preferred heroes
          </p>
          <p className="font-body mt-1 text-xs text-parchment-dim">
            No official roles in Deadlock — this is the signal for what you
            play.
          </p>
        </div>
        <HeroMultiSelect heroes={heroes} defaultSelected={profile.preferred_heroes} />
        <FieldError messages={state?.fieldErrors?.preferredHeroes} />
      </section>

      {/* Playstyle note */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="playstyleNote" className={fieldLabelClass()}>
          Playstyle note
        </Label>
        <Textarea
          id="playstyleNote"
          name="playstyleNote"
          rows={2}
          maxLength={200}
          placeholder="e.g. flex / roam, comfort on Seven"
          defaultValue={profile.playstyle_note ?? ""}
          className="border-brass-dim/60 bg-surface-2"
        />
        <FieldError messages={state?.fieldErrors?.playstyleNote} />
      </div>

      {/* LFT toggle */}
      <section className="frame-brass flex items-center justify-between rounded-sm bg-surface-2 px-4 py-3.5">
        <div>
          <Label htmlFor="isLft" className="font-display text-sm text-parchment">
            Looking for a team
          </Label>
          <p className="font-body mt-0.5 text-xs text-parchment-dim">
            Surfaces your profile on the LFT tab.
          </p>
        </div>
        <Switch id="isLft" name="isLft" defaultChecked={profile.is_lft} />
      </section>

      <Button
        type="submit"
        disabled={pending}
        className="bg-brass text-primary-foreground hover:bg-brass/90 self-start"
      >
        {pending ? "Saving…" : "Save profile"}
      </Button>
    </form>
  );
}
