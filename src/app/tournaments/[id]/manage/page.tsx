import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getTournamentById } from "@/lib/supabase/tournaments";
import { getCurrentUser } from "@/lib/supabase/auth";
import { updateTournamentAction } from "@/lib/actions/tournaments";
import { TournamentForm } from "@/components/tournaments/tournament-form";
import { StatusControl } from "@/components/tournaments/manage/status-control";
import { DeleteTournamentButton } from "@/components/tournaments/manage/delete-tournament-button";
import { DecoDivider } from "@/components/site/deco-divider";

type Params = Promise<{ id: string }>;

export const metadata: Metadata = { title: "Manage Tournament" };
export const dynamic = "force-dynamic";

export default async function ManageTournamentPage({ params }: { params: Params }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/tournaments/${id}/manage`);

  const tournament = await getTournamentById(id);
  if (!tournament) notFound();
  if (tournament.organizer_id !== user.id) redirect(`/tournaments/${id}`);

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="text-center">
        <p className="font-label text-xs tracking-[0.35em] text-verdigris uppercase">
          {tournament.title}
        </p>
        <h1 className="font-display mt-3 text-4xl text-parchment">
          Manage Tournament
        </h1>
      </div>

      <DecoDivider className="mt-8" />

      <div className="frame-brass mt-10 rounded-sm bg-surface px-6 py-8 sm:px-10">
        <p className="font-label text-xs tracking-widest text-verdigris uppercase">
          Status
        </p>
        <p className="font-body mt-2 mb-4 text-sm text-parchment-dim">
          Draft tournaments aren&apos;t visible to anyone else. Open it up
          when you&apos;re ready for people to see it and sign up.
        </p>
        <StatusControl tournamentId={tournament.id} status={tournament.status} />
      </div>

      <div className="frame-brass mt-8 rounded-sm bg-surface px-6 py-8 sm:px-10">
        <p className="font-label text-xs tracking-widest text-verdigris uppercase">
          Details
        </p>
        <div className="mt-5">
          <TournamentForm
            action={updateTournamentAction}
            tournament={tournament}
            submitLabel="Save changes"
          />
        </div>
      </div>

      <div className="frame-brass mt-8 rounded-sm border-oxblood/40 bg-surface px-6 py-8 sm:px-10">
        <p className="font-label text-xs tracking-widest text-oxblood uppercase">
          Danger zone
        </p>
        <p className="font-body mt-2 text-sm text-parchment-dim">
          Deleting a tournament removes its listing entirely. This can&apos;t
          be undone.
        </p>
        <div className="mt-4">
          <DeleteTournamentButton tournamentId={tournament.id} title={tournament.title} />
        </div>
      </div>
    </div>
  );
}
