import Link from "next/link";
import Image from "next/image";
import { MAX_ACTIVE_ROSTER } from "@/lib/teams";
import type { TeamRow } from "@/lib/supabase/teams";

export function TeamCard({
  team,
  memberCount,
}: {
  team: TeamRow;
  memberCount: number;
}) {
  return (
    <Link
      href={`/teams/${team.id}`}
      className="frame-brass group flex flex-col rounded-sm bg-surface p-5 transition-weighted hover:bg-surface-2 hover:shadow-[0_0_24px_-4px_color-mix(in_oklab,var(--brass)_45%,transparent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-sm border border-brass-dim/50 bg-surface-2">
          {team.logo_url ? (
            <Image
              src={team.logo_url}
              alt=""
              width={48}
              height={48}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="font-display text-lg text-brass-dim">
              {team.tag.slice(0, 3)}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-display truncate text-lg text-parchment">
            {team.name}
          </h3>
          <p className="font-label text-xs tracking-widest text-brass-dim uppercase">
            [{team.tag}]{team.region ? ` · ${team.region}` : ""}
          </p>
        </div>
      </div>

      {team.description ? (
        <p className="font-body mt-3 line-clamp-2 text-sm text-parchment-dim">
          {team.description}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="font-label rounded-full border border-brass-dim/50 px-2.5 py-1 text-[10px] tracking-widest text-parchment-dim uppercase">
          {memberCount}/{MAX_ACTIVE_ROSTER} roster
        </span>
        {team.is_recruiting ? (
          <span className="font-label rounded-full border border-verdigris bg-verdigris/10 px-2.5 py-1 text-[10px] tracking-widest text-verdigris uppercase">
            Recruiting
          </span>
        ) : null}
      </div>
    </Link>
  );
}
