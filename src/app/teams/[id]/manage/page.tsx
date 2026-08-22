import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import {
  getTeamById,
  getTeamRoster,
  getPendingRequests,
  getInvitedMembers,
  getInvitableFriends,
} from "@/lib/supabase/teams";
import { getCurrentUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { EditTeamForm } from "@/components/teams/manage/edit-team-form";
import { PendingRequests } from "@/components/teams/manage/pending-requests";
import { RosterRowControls } from "@/components/teams/manage/roster-row-controls";
import { InvitedRowControls } from "@/components/teams/manage/invited-row-controls";
import { InviteFriendForm } from "@/components/teams/manage/invite-friend-form";
import { DeleteTeamButton } from "@/components/teams/manage/delete-team-button";
import { RosterList } from "@/components/teams/roster-list";
import { DecoDivider } from "@/components/site/deco-divider";

type Params = Promise<{ id: string }>;

export const metadata: Metadata = { title: "Manage Team" };
export const dynamic = "force-dynamic";

export default async function ManageTeamPage({ params }: { params: Params }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/teams/${id}/manage`);

  const team = await getTeamById(id);
  if (!team) notFound();

  const supabase = await createClient();
  const { data: membership } = await supabase
    .from("team_members")
    .select("role_on_team")
    .eq("team_id", id)
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  const canManage =
    membership?.role_on_team === "owner" || membership?.role_on_team === "captain";
  if (!canManage) redirect(`/teams/${id}`);

  const [roster, pendingRequests, invitedMembers, invitableFriends] = await Promise.all([
    getTeamRoster(id),
    getPendingRequests(id),
    getInvitedMembers(id),
    getInvitableFriends(id, user.id),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="text-center">
        <p className="font-label text-xs tracking-[0.35em] text-verdigris uppercase">
          {team.name}
        </p>
        <h1 className="font-display mt-3 text-4xl text-parchment">
          Manage Team
        </h1>
      </div>

      <DecoDivider className="mt-8" />

      <div className="frame-brass mt-10 rounded-sm bg-surface px-6 py-8 sm:px-10">
        <p className="font-label text-xs tracking-widest text-verdigris uppercase">
          Team details
        </p>
        <div className="mt-5">
          <EditTeamForm team={team} />
        </div>
      </div>

      <div className="frame-brass mt-8 rounded-sm bg-surface px-6 py-8 sm:px-10">
        <p className="font-label text-xs tracking-widest text-verdigris uppercase">
          Pending requests
        </p>
        <div className="mt-5">
          <PendingRequests teamId={id} requests={pendingRequests} />
        </div>
      </div>

      <div className="frame-brass mt-8 rounded-sm bg-surface px-6 py-8 sm:px-10">
        <p className="font-label text-xs tracking-widest text-verdigris uppercase">
          Invite a friend
        </p>
        <div className="mt-5">
          <InviteFriendForm teamId={id} friends={invitableFriends} />
        </div>
        {invitedMembers.length > 0 ? (
          <div className="mt-6">
            <p className="font-label mb-2 text-xs tracking-widest text-brass-dim uppercase">
              Invited, awaiting response
            </p>
            <RosterList
              roster={invitedMembers}
              renderActions={(entry) => (
                <InvitedRowControls teamId={id} entry={entry} />
              )}
            />
          </div>
        ) : null}
      </div>

      <div className="frame-brass mt-8 rounded-sm bg-surface px-6 py-8 sm:px-10">
        <p className="font-label text-xs tracking-widest text-verdigris uppercase">
          Roster
        </p>
        <div className="mt-5">
          <RosterList
            roster={roster}
            renderActions={(entry) => (
              <RosterRowControls teamId={id} entry={entry} />
            )}
          />
        </div>
      </div>

      {team.owner_id === user.id ? (
        <div className="frame-brass mt-8 rounded-sm border-oxblood/40 bg-surface px-6 py-8 sm:px-10">
          <p className="font-label text-xs tracking-widest text-oxblood uppercase">
            Danger zone
          </p>
          <p className="font-body mt-2 text-sm text-parchment-dim">
            Deleting a team removes its roster and can&apos;t be undone.
          </p>
          <div className="mt-4">
            <DeleteTeamButton teamId={team.id} teamName={team.name} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
