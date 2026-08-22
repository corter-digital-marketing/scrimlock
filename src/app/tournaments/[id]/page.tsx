import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  getTournamentById,
  getRegistrations,
  getMyRegistrations,
} from "@/lib/supabase/tournaments";
import { getManagedTeams } from "@/lib/supabase/teams";
import { getProfileById } from "@/lib/supabase/profiles";
import { getCurrentUser } from "@/lib/supabase/auth";
import { getRankById } from "@/lib/ranks";
import { LocalDateTime } from "@/components/site/local-datetime";
import { DecoDivider } from "@/components/site/deco-divider";
import { RegisterForm } from "@/components/tournaments/register-form";
import { WithdrawButton } from "@/components/tournaments/withdraw-button";
import { ParticipantList } from "@/components/tournaments/participant-list";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const tournament = await getTournamentById(id);
  return { title: tournament?.title ?? "Tournament" };
}

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  open: "Open",
  closed: "Closed",
  in_progress: "In Progress",
  completed: "Completed",
};

export default async function TournamentPage({ params }: { params: Params }) {
  const { id } = await params;
  const tournament = await getTournamentById(id);
  if (!tournament) notFound();

  const [organizer, registrations, currentUser] = await Promise.all([
    getProfileById(tournament.organizer_id),
    getRegistrations(id),
    getCurrentUser(),
  ]);

  const isOrganizer = currentUser?.id === tournament.organizer_id;
  const minRank = getRankById(tournament.min_rank_id);
  const maxRank = getRankById(tournament.max_rank_id);
  const activeCount = registrations.filter((r) => r.status !== "withdrawn").length;
  const spotsLeft = tournament.max_participants - activeCount;
  // This is a Server Component — it runs once per request, so reading the
  // current time here is correct, not a render-purity hazard the lint
  // rule is meant to catch (that rule targets Client Component re-renders).
  // eslint-disable-next-line react-hooks/purity
  const registrationClosed = new Date(tournament.registration_closes_at).getTime() < Date.now();

  const myRegistrations =
    !isOrganizer && currentUser ? await getMyRegistrations(id, currentUser.id) : [];
  const myActive = myRegistrations.find((r) => r.status !== "withdrawn");
  const managedTeams =
    !isOrganizer && currentUser && !myActive && tournament.entry_type === "team"
      ? await getManagedTeams(currentUser.id)
      : [];

  const canRegister =
    !isOrganizer &&
    currentUser &&
    !myActive &&
    tournament.status === "open" &&
    !registrationClosed &&
    spotsLeft > 0;

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="frame-brass overflow-hidden rounded-sm bg-surface">
        {tournament.banner_url ? (
          <div className="relative h-48 w-full border-b border-brass-dim/40">
            <Image src={tournament.banner_url} alt="" fill className="object-cover" />
          </div>
        ) : null}

        <div className="px-6 py-8 sm:px-10">
          <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:items-start sm:justify-between sm:text-left">
            <div>
              <h1 className="font-display text-3xl text-parchment">{tournament.title}</h1>
              <p className="font-label mt-1 text-xs tracking-widest text-brass-dim uppercase">
                {tournament.region} · {tournament.entry_type === "team" ? "Team" : "Solo"}
                {organizer ? (
                  <>
                    {" · Organized by "}
                    <Link href={`/profile/${organizer.username}`} className="hover:text-brass">
                      {organizer.display_name}
                    </Link>
                  </>
                ) : null}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-label rounded-full border border-brass-dim/50 px-2.5 py-1 text-[10px] tracking-widest text-parchment-dim uppercase">
                {STATUS_LABEL[tournament.status]}
              </span>
              {isOrganizer ? (
                <Link
                  href={`/tournaments/${tournament.id}/manage`}
                  className={cn(buttonVariants({ variant: "outline" }), "border-brass-dim")}
                >
                  Manage
                </Link>
              ) : null}
            </div>
          </div>

          <div className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
            <p className="font-body text-parchment-dim">
              Starts <LocalDateTime value={tournament.starts_at} className="text-parchment" />
            </p>
            <p className="font-body text-parchment-dim">
              Registration closes{" "}
              <LocalDateTime value={tournament.registration_closes_at} className="text-parchment" />
            </p>
            {tournament.prize_pool ? (
              <p className="font-body text-parchment-dim">
                Prize pool: <span className="text-parchment">{tournament.prize_pool}</span>
              </p>
            ) : null}
            {tournament.format ? (
              <p className="font-body text-parchment-dim">
                Format: <span className="text-parchment">{tournament.format}</span>
              </p>
            ) : null}
            {minRank || maxRank ? (
              <p className="font-body text-parchment-dim">
                Rank gate:{" "}
                <span className="text-parchment">
                  {minRank?.name ?? "Any"} – {maxRank?.name ?? "Any"}
                </span>
              </p>
            ) : null}
            <p className="font-body text-parchment-dim">
              Spots: <span className="text-parchment">{activeCount}/{tournament.max_participants}</span>
            </p>
          </div>

          {tournament.description ? (
            <p className="font-body mt-5 whitespace-pre-line text-parchment-dim">
              {tournament.description}
            </p>
          ) : null}

          <DecoDivider className="my-8" />

          {!isOrganizer ? (
            <div className="mb-8">
              <p className="font-label mb-3 text-xs tracking-widest text-brass-dim uppercase">
                {myActive ? "Your registration" : "Register"}
              </p>
              {!currentUser ? (
                <div>
                  <p className="font-body text-sm text-parchment-dim">
                    Sign in to register.
                  </p>
                  <Link
                    href={`/login?next=/tournaments/${tournament.id}`}
                    className={cn(buttonVariants(), "bg-brass text-primary-foreground hover:bg-brass/90 mt-4")}
                  >
                    Sign In
                  </Link>
                </div>
              ) : myActive ? (
                <div className="flex items-center gap-3">
                  <span className="font-label text-xs tracking-widest text-parchment-dim uppercase">
                    {myActive.status}
                    {myActive.team ? ` · ${myActive.team.name}` : ""}
                  </span>
                  <WithdrawButton tournamentId={tournament.id} registrationId={myActive.id} />
                </div>
              ) : canRegister ? (
                <RegisterForm
                  tournamentId={tournament.id}
                  entryType={tournament.entry_type}
                  teams={managedTeams}
                />
              ) : (
                <p className="font-body text-sm text-parchment-dim">
                  {tournament.status !== "open"
                    ? "Registration isn't open."
                    : registrationClosed
                      ? "Registration has closed."
                      : "This tournament is full."}
                </p>
              )}
            </div>
          ) : null}

          <div>
            <p className="font-label mb-3 text-xs tracking-widest text-brass-dim uppercase">
              Participants
            </p>
            <ParticipantList registrations={registrations} />
          </div>
        </div>
      </div>
    </div>
  );
}
