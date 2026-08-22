import Link from "next/link";
import Image from "next/image";
import { LocalDateTime } from "@/components/site/local-datetime";
import { getRankById } from "@/lib/ranks";
import { cn } from "@/lib/utils";
import type { TournamentRow } from "@/lib/supabase/tournaments";

const STATUS_LABEL: Record<string, string> = {
  open: "Open",
  closed: "Closed",
  in_progress: "In Progress",
  completed: "Completed",
  draft: "Draft",
};

export function TournamentCard({ tournament }: { tournament: TournamentRow }) {
  const minRank = getRankById(tournament.min_rank_id);
  const maxRank = getRankById(tournament.max_rank_id);

  return (
    <Link
      href={`/tournaments/${tournament.id}`}
      className="frame-brass group flex flex-col overflow-hidden rounded-sm bg-surface transition-weighted hover:bg-surface-2 hover:shadow-[0_0_24px_-4px_color-mix(in_oklab,var(--brass)_45%,transparent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass"
    >
      <div className="relative flex h-28 items-center justify-center overflow-hidden border-b border-brass-dim/40 bg-surface-2">
        {tournament.banner_url ? (
          <Image
            src={tournament.banner_url}
            alt=""
            fill
            className="object-cover"
          />
        ) : (
          <span className="font-display text-3xl text-brass-dim/60">⚔</span>
        )}
        <span
          className={cn(
            "font-label absolute top-2 right-2 rounded-full border px-2.5 py-1 text-[10px] tracking-widest uppercase",
            tournament.status === "open" && "border-verdigris bg-void/70 text-verdigris",
            tournament.status === "closed" && "border-brass-dim bg-void/70 text-parchment-dim",
            tournament.status === "in_progress" && "border-brass bg-void/70 text-brass",
            tournament.status === "completed" && "border-brass-dim bg-void/70 text-parchment-dim",
            tournament.status === "draft" && "border-oxblood/60 bg-void/70 text-oxblood",
          )}
        >
          {STATUS_LABEL[tournament.status]}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-lg text-parchment">{tournament.title}</h3>
        <p className="font-label mt-1 text-xs tracking-widest text-brass-dim uppercase">
          {tournament.region} · {tournament.entry_type === "team" ? "Team" : "Solo"}
        </p>

        <p className="font-body mt-3 text-sm text-parchment-dim">
          Starts <LocalDateTime value={tournament.starts_at} />
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {tournament.prize_pool ? (
            <span className="font-label rounded-full border border-brass-dim/50 px-2.5 py-1 text-[10px] tracking-widest text-parchment-dim uppercase">
              {tournament.prize_pool}
            </span>
          ) : null}
          {minRank || maxRank ? (
            <span className="font-label rounded-full border border-brass-dim/50 px-2.5 py-1 text-[10px] tracking-widest text-parchment-dim uppercase">
              {minRank?.name ?? "Any"} – {maxRank?.name ?? "Any"}
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
