import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getScrimById,
  getScrimResponses,
  getOwnResponse,
} from "@/lib/supabase/scrims";
import { getTeamById, getManagedTeams } from "@/lib/supabase/teams";
import { getProfileById } from "@/lib/supabase/profiles";
import { getCurrentUser } from "@/lib/supabase/auth";
import { getRankById } from "@/lib/ranks";
import { LocalDateTime } from "@/components/site/local-datetime";
import { DecoDivider } from "@/components/site/deco-divider";
import { RespondForm } from "@/components/scrims/respond-form";
import { ResponseList } from "@/components/scrims/response-list";
import { ScrimPosterActions } from "@/components/scrims/scrim-poster-actions";
import { CancelResponseButton } from "@/components/scrims/cancel-response-button";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const scrim = await getScrimById(id);
  return { title: scrim ? `Scrim · ${scrim.region}` : "Scrim" };
}

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  open: "Open",
  matched: "Matched",
  cancelled: "Cancelled",
};

export default async function ScrimPage({ params }: { params: Params }) {
  const { id } = await params;
  const scrim = await getScrimById(id);
  if (!scrim) notFound();

  const [poster, team, currentUser] = await Promise.all([
    getProfileById(scrim.posted_by),
    scrim.team_id ? getTeamById(scrim.team_id) : Promise.resolve(null),
    getCurrentUser(),
  ]);

  const isPoster = currentUser?.id === scrim.posted_by;
  const minRank = getRankById(scrim.min_rank_id);
  const maxRank = getRankById(scrim.max_rank_id);

  const responses = isPoster ? await getScrimResponses(id) : [];
  const ownResponse =
    !isPoster && currentUser ? await getOwnResponse(id, currentUser.id) : null;
  const managedTeams =
    !isPoster && currentUser && !ownResponse && scrim.status === "open"
      ? await getManagedTeams(currentUser.id)
      : [];

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="frame-brass rounded-sm bg-surface px-6 py-8 sm:px-10">
        <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:items-start sm:justify-between sm:text-left">
          <div>
            <h1 className="font-display text-3xl text-parchment">
              <LocalDateTime value={scrim.scheduled_for} />
            </h1>
            <p className="font-label mt-1 text-xs tracking-widest text-brass-dim uppercase">
              {team ? (
                <Link href={`/teams/${team.id}`} className="hover:text-brass">
                  {team.name} [{team.tag}]
                </Link>
              ) : poster ? (
                <Link href={`/profile/${poster.username}`} className="hover:text-brass">
                  {poster.display_name}
                </Link>
              ) : (
                "Unknown poster"
              )}
              {" · "}
              {scrim.region}
            </p>
          </div>
          <span
            className={cn(
              "font-label rounded-full border px-2.5 py-1 text-[10px] tracking-widest uppercase",
              scrim.status === "open" && "border-verdigris text-verdigris",
              scrim.status === "matched" && "border-brass text-brass",
              scrim.status === "cancelled" && "border-oxblood/60 text-oxblood",
            )}
          >
            {STATUS_LABEL[scrim.status]}
          </span>
        </div>

        <p className="font-label mt-4 text-xs tracking-widest text-parchment-dim uppercase">
          Opponent rank: {minRank?.name ?? "Any"} – {maxRank?.name ?? "Any"}
        </p>

        {scrim.notes ? (
          <p className="font-body mt-4 text-parchment-dim">{scrim.notes}</p>
        ) : null}

        {isPoster ? (
          <div className="mt-6">
            <ScrimPosterActions scrimId={scrim.id} />
          </div>
        ) : null}

        <DecoDivider className="my-8" />

        {isPoster ? (
          <div>
            <p className="font-label mb-3 text-xs tracking-widest text-brass-dim uppercase">
              Responses
            </p>
            <ResponseList scrimId={scrim.id} responses={responses} canManage />
          </div>
        ) : currentUser ? (
          <div>
            <p className="font-label mb-3 text-xs tracking-widest text-brass-dim uppercase">
              {ownResponse ? "Your response" : "Respond"}
            </p>
            {scrim.status !== "open" ? (
              <p className="font-body text-sm text-parchment-dim">
                This scrim isn&apos;t open anymore.
              </p>
            ) : ownResponse ? (
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "font-label text-xs tracking-widest uppercase",
                    ownResponse.status === "accepted" && "text-verdigris",
                    ownResponse.status === "declined" && "text-oxblood",
                    ownResponse.status === "pending" && "text-parchment-dim",
                  )}
                >
                  {ownResponse.status}
                </span>
                {ownResponse.status === "pending" ? (
                  <CancelResponseButton scrimId={scrim.id} />
                ) : null}
              </div>
            ) : (
              <RespondForm scrimId={scrim.id} teams={managedTeams} />
            )}
          </div>
        ) : (
          <div className="text-center">
            <p className="font-body text-parchment-dim">
              Sign in to respond to this scrim.
            </p>
            <Link
              href={`/login?next=/scrims/${scrim.id}`}
              className={cn(buttonVariants(), "bg-brass text-primary-foreground hover:bg-brass/90 mt-4")}
            >
              Sign In
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
