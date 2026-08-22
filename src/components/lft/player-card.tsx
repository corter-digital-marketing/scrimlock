import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RankBadge } from "@/components/site/rank-badge";
import { getRankById } from "@/lib/ranks";
import type { ProfileRow } from "@/lib/supabase/profiles";
import type { HeroOption } from "@/lib/supabase/heroes";

export function PlayerCard({
  profile,
  heroesById,
}: {
  profile: ProfileRow;
  heroesById: Map<string, HeroOption>;
}) {
  const rank = getRankById(profile.rank_id);
  const heroes = profile.preferred_heroes
    .map((id) => heroesById.get(id))
    .filter(Boolean) as HeroOption[];

  return (
    <Link
      href={`/profile/${profile.username}`}
      className="frame-brass group flex flex-col rounded-sm bg-surface p-5 transition-weighted hover:bg-surface-2 hover:shadow-[0_0_24px_-4px_color-mix(in_oklab,var(--brass)_45%,transparent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass"
    >
      <div className="flex items-start gap-3">
        <Avatar className="border border-brass-dim/50">
          {profile.avatar_url ? (
            <AvatarImage src={profile.avatar_url} alt="" />
          ) : null}
          <AvatarFallback className="font-label bg-surface-2 text-xs text-brass">
            {(profile.display_name || profile.username).slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <h3 className="font-display truncate text-lg text-parchment">
            {profile.display_name}
          </h3>
          <p className="font-label text-xs tracking-widest text-brass-dim uppercase">
            @{profile.username}
            {profile.region ? ` · ${profile.region}` : ""}
          </p>
        </div>
        {rank ? (
          <RankBadge rankName={rank.name} iconSrc={rank.icon} subrank={profile.rank_subrank} size="sm" />
        ) : null}
      </div>

      {profile.playstyle_note ? (
        <p className="font-body mt-3 line-clamp-2 text-sm text-parchment-dim italic">
          &ldquo;{profile.playstyle_note}&rdquo;
        </p>
      ) : null}

      {heroes.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {heroes.slice(0, 5).map((hero) => (
            <span
              key={hero.id}
              className="font-label rounded-full border border-brass-dim/50 px-2 py-0.5 text-[10px] tracking-wide text-parchment-dim uppercase"
            >
              {hero.name}
            </span>
          ))}
          {heroes.length > 5 ? (
            <span className="font-label px-1 text-[10px] text-parchment-dim">
              +{heroes.length - 5}
            </span>
          ) : null}
        </div>
      ) : null}
    </Link>
  );
}
