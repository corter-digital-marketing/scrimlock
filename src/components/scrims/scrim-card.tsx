import Link from "next/link";
import { LocalDateTime } from "@/components/site/local-datetime";
import { getRankById } from "@/lib/ranks";
import type { ScrimRow } from "@/lib/supabase/scrims";

export function ScrimCard({
  scrim,
  teamName,
}: {
  scrim: ScrimRow;
  teamName?: string;
}) {
  const minRank = getRankById(scrim.min_rank_id);
  const maxRank = getRankById(scrim.max_rank_id);

  return (
    <Link
      href={`/scrims/${scrim.id}`}
      className="frame-brass group flex flex-col rounded-sm bg-surface p-5 transition-weighted hover:bg-surface-2 hover:shadow-[0_0_24px_-4px_color-mix(in_oklab,var(--brass)_45%,transparent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="font-display text-lg text-parchment">
          <LocalDateTime value={scrim.scheduled_for} />
        </p>
        <span className="font-label rounded-full border border-brass-dim/50 px-2.5 py-1 text-[10px] tracking-widest text-parchment-dim uppercase">
          {scrim.region}
        </span>
      </div>

      <p className="font-label mt-2 text-xs tracking-widest text-brass-dim uppercase">
        {teamName ? teamName : "Solo"}
        {minRank || maxRank
          ? ` · ${minRank?.name ?? "Any"} – ${maxRank?.name ?? "Any"}`
          : " · Any rank"}
      </p>

      {scrim.notes ? (
        <p className="font-body mt-3 line-clamp-2 text-sm text-parchment-dim">
          {scrim.notes}
        </p>
      ) : null}
    </Link>
  );
}
