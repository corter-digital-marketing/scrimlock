import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTeamById, getTeamRoster, getMembership } from "@/lib/supabase/teams";
import { getCurrentUser } from "@/lib/supabase/auth";
import { getProfileById } from "@/lib/supabase/profiles";
import { RosterList } from "@/components/teams/roster-list";
import { TeamJoinActions } from "@/components/teams/team-join-actions";
import { MessageButton } from "@/components/messages/message-button";
import { DecoDivider } from "@/components/site/deco-divider";
import { MAX_ACTIVE_ROSTER } from "@/lib/teams";

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const team = await getTeamById(id);
  return { title: team ? `${team.name} [${team.tag}]` : "Team" };
}

export const dynamic = "force-dynamic";

export default async function TeamPage({ params }: { params: Params }) {
  const { id } = await params;
  const team = await getTeamById(id);
  if (!team) notFound();

  const [roster, currentUser, owner] = await Promise.all([
    getTeamRoster(id),
    getCurrentUser(),
    getProfileById(team.owner_id),
  ]);

  const membership = currentUser ? await getMembership(id, currentUser.id) : null;
  const activeCount = roster.filter((m) => m.role_on_team !== "sub").length;
  const showMessageCaptain = currentUser && currentUser.id !== team.owner_id && owner;

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="frame-brass rounded-sm bg-surface px-6 py-8 sm:px-10">
        <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:items-start sm:text-left">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-sm border border-brass-dim/50 bg-surface-2">
            {team.logo_url ? (
              <Image
                src={team.logo_url}
                alt=""
                width={80}
                height={80}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="font-display text-2xl text-brass-dim">
                {team.tag.slice(0, 3)}
              </span>
            )}
          </div>

          <div className="flex-1">
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="font-display text-3xl text-parchment">
                  {team.name}
                </h1>
                <p className="font-label text-xs tracking-widest text-brass-dim uppercase">
                  [{team.tag}]{team.region ? ` · ${team.region}` : ""}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {showMessageCaptain ? (
                  <MessageButton username={owner.username} />
                ) : null}
                <TeamJoinActions
                  teamId={team.id}
                  isRecruiting={team.is_recruiting}
                  status={membership?.status ?? null}
                  role={membership?.role_on_team ?? null}
                />
              </div>
            </div>

            <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
              <span className="font-label rounded-full border border-brass-dim/50 px-2.5 py-1 text-[10px] tracking-widest text-parchment-dim uppercase">
                {activeCount}/{MAX_ACTIVE_ROSTER} roster
              </span>
              {team.is_recruiting ? (
                <span className="font-label rounded-full border border-verdigris bg-verdigris/10 px-2.5 py-1 text-[10px] tracking-widest text-verdigris uppercase">
                  Recruiting
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {team.description ? (
          <p className="font-body mt-6 text-parchment-dim">{team.description}</p>
        ) : null}

        {team.is_recruiting && team.recruiting_note ? (
          <div className="mt-4 rounded-sm border border-verdigris/40 bg-verdigris/5 px-4 py-3">
            <p className="font-label text-[10px] tracking-widest text-verdigris uppercase">
              Wanted
            </p>
            <p className="font-body mt-1 text-sm text-parchment">
              {team.recruiting_note}
            </p>
          </div>
        ) : null}

        <DecoDivider className="my-8" />

        <div>
          <p className="font-label mb-3 text-xs tracking-widest text-brass-dim uppercase">
            Roster
          </p>
          <RosterList roster={roster} />
        </div>
      </div>
    </div>
  );
}
