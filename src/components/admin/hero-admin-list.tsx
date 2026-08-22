"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { toggleHeroActiveAction } from "@/lib/actions/admin";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import type { HeroRow } from "@/lib/supabase/heroes";

export function HeroAdminList({ heroes }: { heroes: HeroRow[] }) {
  const [pending, startTransition] = useTransition();

  function toggle(hero: HeroRow) {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("heroId", hero.id);
      fd.set("isActive", String(hero.is_active));
      const result = await toggleHeroActiveAction(fd);
      if (result?.error) toast.error(result.error);
    });
  }

  if (heroes.length === 0) {
    return <p className="font-body text-sm text-parchment-dim">No heroes seeded yet.</p>;
  }

  return (
    <ul className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
      {heroes.map((hero) => (
        <li
          key={hero.id}
          className="flex items-center justify-between gap-3 border-b border-brass-dim/15 py-2"
        >
          <Label
            htmlFor={`hero-${hero.id}`}
            className={
              "font-body text-sm " + (hero.is_active ? "text-parchment" : "text-parchment-dim")
            }
          >
            {hero.name}
          </Label>
          <Switch
            id={`hero-${hero.id}`}
            checked={hero.is_active}
            disabled={pending}
            onCheckedChange={() => toggle(hero)}
          />
        </li>
      ))}
    </ul>
  );
}
