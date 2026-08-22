import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/auth";
import { getMatchById, getMatchPlayers, getMatchVotes } from "@/lib/supabase/pug-matches";
import { MatchRoster } from "@/components/pug/match-roster";
import { LobbyCodeForm } from "@/components/pug/lobby-code-form";
import { VotePanel } from "@/components/pug/vote-panel";
import { PugAutoRefresh } from "@/components/pug/pug-auto-refresh";
import { DecoDivider } from "@/components/site/deco-divider";
import { PagePlaceholder } from "@/components/site/page-placeholder";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Params = Promise<{ matchId: string }>;

export const metadata: Metadata = { title: "PUG Match" };
export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  lobby_pending: "Waiting on lobby code",
  in_progress: "In progress",
  completed: "Completed",
};

function MatchUnavailable() {
  return (
    <PagePlaceholder
      eyebrow="PUG Scrims"
      title="Match Not Found"
      description="This match doesn't exist, or you're not one of the 12 players in it."
      phaseNote="If you were just queued, head back to PUG — matchmaking runs there."
    >
      <Link
        href="/pug"
        className={cn(buttonVariants(), "bg-brass text-primary-foreground hover:bg-brass/90 mt-10")}
      >
        Back to PUG
      </Link>
    </PagePlaceholder>
  );
}

export default async function PugMatchPage({ params }: { params: Params }) {
  const { matchId } = await params;
  // Signed-out visitors are caught by proxy.ts before this ever runs (a
  // fresh/direct GET here doesn't reliably honor this redirect() — see
  // the note in proxy.ts). Kept as defense in depth for in-app navigation.
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/pug/${matchId}`);

  const match = await getMatchById(matchId);
  if (!match) return <MatchUnavailable />;

  const [players, votes] = await Promise.all([
    getMatchPlayers(matchId),
    getMatchVotes(matchId),
  ]);

  const isPlayer = players.some((p) => p.user_id === user.id);
  if (!isPlayer) return <MatchUnavailable />;

  const isLobbyMaker = match.lobby_maker_id === user.id;
  const team1 = players.filter((p) => p.team === 1);
  const team2 = players.filter((p) => p.team === 2);
  const team1Votes = votes.filter((v) => v.voted_team === 1).length;
  const team2Votes = votes.filter((v) => v.voted_team === 2).length;
  const myVote = votes.find((v) => v.voter_id === user.id)?.voted_team ?? null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      {match.status !== "completed" ? <PugAutoRefresh /> : null}

      <div className="text-center">
        <p className="font-label text-xs tracking-[0.35em] text-verdigris uppercase">
          {match.region}
        </p>
        <h1 className="font-display mt-3 text-4xl text-parchment">
          PUG Match
        </h1>
        <p
          className={cn(
            "font-label mt-2 text-xs tracking-widest uppercase",
            match.status === "completed" ? "text-brass" : "text-parchment-dim",
          )}
        >
          {STATUS_LABEL[match.status]}
        </p>
      </div>

      <DecoDivider className="mt-8" />

      <div className="frame-brass mt-8 rounded-sm bg-surface px-6 py-8 sm:px-10">
        <p className="font-label mb-3 text-xs tracking-widest text-brass-dim uppercase">
          Lobby
        </p>
        {match.lobby_code ? (
          <p className="font-body text-parchment">
            Join code: <span className="text-brass select-all">{match.lobby_code}</span>
          </p>
        ) : isLobbyMaker ? (
          <div>
            <p className="font-body mb-3 text-sm text-parchment-dim">
              You&apos;re the lobby maker — create the custom lobby in Deadlock
              and paste the join code here for everyone.
            </p>
            <LobbyCodeForm matchId={match.id} />
          </div>
        ) : (
          <p className="font-body text-sm text-parchment-dim">
            Waiting on the lobby maker to post the join code…
          </p>
        )}
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <div className="frame-brass rounded-sm bg-surface px-6 py-6">
          <p className="font-label mb-3 text-xs tracking-widest text-brass-dim uppercase">
            Team 1
          </p>
          <MatchRoster
            players={team1}
            lobbyMakerId={match.lobby_maker_id}
            won={match.winning_team === 1}
          />
        </div>
        <div className="frame-brass rounded-sm bg-surface px-6 py-6">
          <p className="font-label mb-3 text-xs tracking-widest text-brass-dim uppercase">
            Team 2
          </p>
          <MatchRoster
            players={team2}
            lobbyMakerId={match.lobby_maker_id}
            won={match.winning_team === 2}
          />
        </div>
      </div>

      <div className="frame-brass mt-8 rounded-sm bg-surface px-6 py-8 sm:px-10">
        {match.status === "completed" ? (
          <p className="font-body text-center text-parchment">
            Team {match.winning_team} won. ELO has been applied.
          </p>
        ) : !match.lobby_code ? (
          <p className="font-body text-center text-sm text-parchment-dim">
            Voting opens once the lobby code is posted.
          </p>
        ) : (
          <VotePanel
            matchId={match.id}
            team1Votes={team1Votes}
            team2Votes={team2Votes}
            myVote={myVote}
          />
        )}
      </div>
    </div>
  );
}
