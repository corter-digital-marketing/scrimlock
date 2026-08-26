import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { getTournamentById } from "@/lib/supabase/tournaments";
import { getProfileById } from "@/lib/supabase/profiles";
import { getCurrentUser } from "@/lib/supabase/auth";
import { getRankById } from "@/lib/ranks";
import { LocalDateTime } from "@/components/site/local-datetime";
import { DecoDivider } from "@/components/site/deco-divider";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SITE_URL } from "@/lib/site";
import { safeJsonLd } from "@/lib/json-ld";

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const tournament = await getTournamentById(id);
  if (!tournament) return { title: "Tournament" };

  const description =
    tournament.description?.slice(0, 155) ??
    `${tournament.title} — a ${tournament.region} Deadlock tournament${tournament.prize_pool ? ` with a ${tournament.prize_pool} prize pool` : ""}. See details and sign up.`;

  return {
    title: tournament.title,
    description,
    alternates: { canonical: `/tournaments/${tournament.id}` },
    // Draft tournaments are deliberately left out of the public /tournaments
    // listing (see getTournaments) — keep them out of search results too,
    // even though the page itself is still reachable by direct link.
    robots: tournament.status === "draft" ? { index: false, follow: false } : undefined,
    openGraph: { title: tournament.title, description },
  };
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

  const [organizer, currentUser] = await Promise.all([
    getProfileById(tournament.organizer_id),
    getCurrentUser(),
  ]);

  const isOrganizer = currentUser?.id === tournament.organizer_id;
  const minRank = getRankById(tournament.min_rank_id);
  const maxRank = getRankById(tournament.max_rank_id);

  // Event structured data — eligible for Google's event rich results
  // (date, organizer, "sign up" link shown right in search). Skipped for
  // drafts, which are noindexed anyway.
  const jsonLd =
    tournament.status === "draft"
      ? null
      : {
          "@context": "https://schema.org",
          "@type": "Event",
          name: tournament.title,
          description: tournament.description ?? `A ${tournament.region} Deadlock tournament.`,
          startDate: tournament.starts_at,
          eventStatus: "https://schema.org/EventScheduled",
          eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
          location: {
            "@type": "VirtualLocation",
            url: tournament.signup_url || `${SITE_URL}/tournaments/${tournament.id}`,
          },
          ...(tournament.banner_url ? { image: [tournament.banner_url] } : {}),
          organizer: organizer
            ? {
                "@type": "Person",
                name: organizer.display_name,
                url: `${SITE_URL}/profile/${organizer.username}`,
              }
            : undefined,
          url: `${SITE_URL}/tournaments/${tournament.id}`,
        };

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      {jsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
        />
      ) : null}
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
              Field size: <span className="text-parchment">up to {tournament.max_participants}</span>
            </p>
          </div>

          {tournament.description ? (
            <p className="font-body mt-5 whitespace-pre-line text-parchment-dim">
              {tournament.description}
            </p>
          ) : null}

          <DecoDivider className="my-8" />

          <div className="text-center">
            <p className="font-label mb-3 text-xs tracking-widest text-brass-dim uppercase">
              Sign Up
            </p>
            {tournament.signup_url ? (
              <>
                <Link
                  href={tournament.signup_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "bg-brass text-primary-foreground hover:bg-brass/90",
                  )}
                >
                  <ExternalLink className="h-4 w-4" />
                  Sign Up
                </Link>
                <p className="font-body mt-3 text-xs text-parchment-dim">
                  Signups are run by the organizer, off ScrimLock.
                </p>
              </>
            ) : (
              <p className="font-body text-sm text-parchment-dim">
                {isOrganizer
                  ? "Add a signup link from the manage page so people know where to register."
                  : "The organizer hasn't posted a signup link yet — check back soon."}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
