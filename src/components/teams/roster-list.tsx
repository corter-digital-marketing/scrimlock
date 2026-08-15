import type { ReactNode } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getRankById } from "@/lib/ranks";
import { TEAM_ROLE_LABELS } from "@/lib/teams";
import type { RosterEntry } from "@/lib/supabase/teams";

export function RosterList({
  roster,
  renderActions,
}: {
  roster: RosterEntry[];
  renderActions?: (entry: RosterEntry) => ReactNode;
}) {
  if (roster.length === 0) {
    return (
      <p className="font-body text-sm text-parchment-dim">No members yet.</p>
    );
  }

  return (
    <ul className="flex flex-col divide-y divide-brass-dim/20">
      {roster.map((entry) => {
        const profile = entry.profile;
        const rank = getRankById(profile?.rank_id ?? null);
        return (
          <li key={entry.id} className="flex items-center gap-3 py-3">
            <Avatar className="border border-brass-dim/50">
              {profile?.avatar_url ? (
                <AvatarImage src={profile.avatar_url} alt="" />
              ) : null}
              <AvatarFallback className="font-label bg-surface-2 text-xs text-brass">
                {(profile?.display_name || profile?.username || "?")
                  .slice(0, 2)
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
              {profile ? (
                <Link
                  href={`/profile/${profile.username}`}
                  className="font-body block truncate text-sm text-parchment hover:text-brass"
                >
                  {profile.display_name}
                </Link>
              ) : (
                <span className="font-body text-sm text-parchment-dim">
                  Unknown player
                </span>
              )}
              <p className="font-label text-[10px] tracking-widest text-parchment-dim uppercase">
                {TEAM_ROLE_LABELS[entry.role_on_team]}
                {rank ? ` · ${rank.name}` : ""}
              </p>
            </div>

            {renderActions ? renderActions(entry) : null}
          </li>
        );
      })}
    </ul>
  );
}
