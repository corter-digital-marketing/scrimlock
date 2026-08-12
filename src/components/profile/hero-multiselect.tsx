"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { MAX_PREFERRED_HEROES } from "@/lib/validations/profile";
import type { HeroOption } from "@/lib/supabase/heroes";

export function HeroMultiSelect({
  heroes,
  defaultSelected = [],
}: {
  heroes: HeroOption[];
  defaultSelected?: string[];
}) {
  const [selected, setSelected] = useState<string[]>(defaultSelected);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return heroes;
    return heroes.filter((h) => h.name.toLowerCase().includes(q));
  }, [heroes, query]);

  const selectedHeroes = useMemo(
    () => selected.map((id) => heroes.find((h) => h.id === id)).filter(Boolean) as HeroOption[],
    [selected, heroes],
  );

  const atMax = selected.length >= MAX_PREFERRED_HEROES;

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length >= MAX_PREFERRED_HEROES
          ? prev
          : [...prev, id],
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {selectedHeroes.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {selectedHeroes.map((hero) => (
            <button
              key={hero.id}
              type="button"
              onClick={() => toggle(hero.id)}
              className="font-label flex items-center gap-1 rounded-full border border-brass bg-brass/10 px-2.5 py-1 text-[11px] tracking-wide text-brass uppercase transition-weighted hover:bg-brass/20"
            >
              {hero.name}
              <X className="h-3 w-3" />
            </button>
          ))}
        </div>
      ) : null}

      <Input
        type="search"
        placeholder="Search heroes…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="border-brass-dim/60 bg-surface-2"
      />

      <div className="flex max-h-48 flex-wrap gap-1.5 overflow-y-auto rounded-sm border border-brass-dim/30 bg-surface-2/50 p-3">
        {filtered.length === 0 ? (
          <p className="font-body text-sm text-parchment-dim">
            {heroes.length === 0
              ? "No heroes available yet."
              : "No heroes match that search."}
          </p>
        ) : (
          filtered.map((hero) => {
            const isSelected = selected.includes(hero.id);
            return (
              <button
                key={hero.id}
                type="button"
                disabled={!isSelected && atMax}
                onClick={() => toggle(hero.id)}
                className={cn(
                  "font-label rounded-full border px-2.5 py-1 text-[11px] tracking-wide uppercase transition-weighted disabled:cursor-not-allowed disabled:opacity-40",
                  isSelected
                    ? "border-brass bg-brass text-primary-foreground"
                    : "border-brass-dim/50 bg-surface text-parchment-dim hover:border-brass-dim hover:text-parchment",
                )}
              >
                {hero.name}
              </button>
            );
          })
        )}
      </div>

      <p className="font-body text-xs text-parchment-dim">
        {selected.length}/{MAX_PREFERRED_HEROES} selected
      </p>

      {selected.map((id) => (
        <input key={id} type="hidden" name="preferredHeroes" value={id} />
      ))}
    </div>
  );
}
