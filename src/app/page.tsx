import Link from "next/link";
import { Trophy, Swords, UserSearch, Search, MessageCircle, Coffee, Bug } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { SigilMark } from "@/components/site/sigil-mark";
import { DecoDivider } from "@/components/site/deco-divider";
import { BugReportForm } from "@/components/site/bug-report-form";
import { PugLetterBadge } from "@/components/pug/pug-letter-badge";
import { PUG_LETTER_RANKS } from "@/lib/pug-elo";

// TODO: swap in the real invite/donate links.
const DISCORD_INVITE_URL = "https://discord.gg/your-invite";
const PAYPAL_DONATE_URL = "https://paypal.me/your-username";

const tabCards = [
  {
    href: "/tournaments",
    icon: Trophy,
    tag: "Compete",
    title: "Tournaments",
    blurb:
      "Organizers post tournaments with prize pools and rank requirements. Enter solo or bring your team.",
  },
  {
    href: "/scrims",
    icon: Swords,
    tag: "Practice",
    title: "Scrims",
    blurb:
      "Post 6v6 practice availability and find opponents by rank range, region, and time — in your own timezone.",
  },
  {
    href: "/lft",
    icon: UserSearch,
    tag: "Recruit",
    title: "LFT",
    blurb:
      "Players advertise preferred heroes and rank. Teams post open slots. No rigid roles — just what you play.",
  },
];

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="deco-corners relative overflow-hidden border-b border-brass-dim/40 bg-surface">
        <SigilMark
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 right-[-6rem] h-[36rem] w-[36rem] -translate-y-1/2 text-brass opacity-[0.05]"
        />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <div className="max-w-2xl">
            <p className="font-label text-xs tracking-[0.35em] text-verdigris uppercase">
              The competitive hub for Deadlock
            </p>
            <h1 className="font-display mt-4 flex flex-wrap items-center gap-3 text-5xl leading-[1.05] tracking-tight text-parchment sm:text-6xl">
              Welcome to ScrimLock
              <span className="font-label text-glow-brass rounded-sm border border-brass px-2 py-1 text-sm tracking-widest text-brass uppercase">
                Beta
              </span>
            </h1>
            <p className="font-body mt-6 text-lg leading-relaxed text-parchment-dim">
              ScrimLock is a community hub for Deadlock players looking to up
              their game and break into the competitive scene — play PUGs,
              schedule scrims, sign up for tournaments, and find a team.
            </p>
            <div className="mt-9 flex flex-wrap gap-4">
              <Link
                href="/signup"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "bg-brass text-primary-foreground hover:bg-brass/90 shadow-[0_0_0_1px_var(--brass-dim)]",
                )}
              >
                Sign Up
              </Link>
              <Link
                href="/pug"
                className={cn(
                  buttonVariants({ size: "lg", variant: "outline" }),
                  "border-verdigris text-verdigris hover:bg-verdigris/10",
                )}
              >
                <Search className="h-4 w-4" />
                Play PUGs
              </Link>
              <Link
                href={DISCORD_INVITE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  buttonVariants({ size: "lg", variant: "outline" }),
                  "border-brass-dim text-parchment hover:bg-surface-2 hover:text-brass",
                )}
              >
                <MessageCircle className="h-4 w-4" />
                Join Discord
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* PUG Scrims */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="deco-corners relative overflow-hidden border border-brass-dim/40 bg-surface px-6 py-14 text-center sm:px-12">
          <SigilMark
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 text-brass opacity-[0.04]"
          />
          <div className="relative">
            <Search className="mx-auto h-9 w-9 text-verdigris" strokeWidth={1.25} />
            <p className="font-label mt-4 text-xs tracking-[0.35em] text-verdigris uppercase">
              The main event
            </p>
            <h2 className="font-display mt-3 text-3xl text-parchment sm:text-4xl">
              PUG Scrims
            </h2>
            <p className="font-body mx-auto mt-4 max-w-2xl text-parchment-dim">
              Queue up solo or with a party and get matched into a real 6v6 —
              no waiting on a scrim partner to reply, no organizing a whole
              tournament bracket. Whoever&apos;s in queue gets balanced by
              ELO into two teams, the highest-rated player runs the lobby,
              and the room votes on the result when it&apos;s over. Win, and
              your ELO climbs the ladder below.
            </p>
            <Link
              href="/pug"
              className={cn(
                buttonVariants({ size: "lg" }),
                "bg-verdigris text-primary-foreground hover:bg-verdigris/90 mt-8",
              )}
            >
              <Search className="h-4 w-4" />
              Play PUGs
            </Link>
          </div>
        </div>
      </section>

      {/* PUG ranked ladder */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="font-label text-xs tracking-[0.35em] text-verdigris uppercase">
            Unranked to S
          </p>
          <h2 className="font-display mt-3 text-3xl text-parchment sm:text-4xl">
            The PUG Ladder
          </h2>
          <p className="font-body mx-auto mt-4 max-w-xl text-parchment-dim">
            Its own scale, separate from your Deadlock rank — this one&apos;s
            purely about how you do in PUG Scrims.
          </p>
        </div>

        <div className="mt-12 flex flex-wrap justify-center gap-x-8 gap-y-10">
          {PUG_LETTER_RANKS.map((rank, i) => {
            const next = PUG_LETTER_RANKS[i + 1];
            return (
              <div key={rank.letter} className="flex flex-col items-center gap-2">
                <PugLetterBadge elo={rank.minElo} size="lg" />
                <span className="font-label text-xs tracking-widest text-parchment uppercase">
                  {rank.letter}
                </span>
                <span className="font-label text-parchment-dim text-[10px] tracking-widest uppercase">
                  {next ? `${rank.minElo}–${next.minElo - 1}` : `${rank.minElo}+`} ELO
                </span>
              </div>
            );
          })}
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <DecoDivider />
      </div>

      {/* Three tabs */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="font-label text-xs tracking-[0.35em] text-verdigris uppercase">
            Three more ways in
          </p>
          <h2 className="font-display mt-3 text-3xl text-parchment sm:text-4xl">
            Tournaments, Scrims &amp; LFT
          </h2>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {tabCards.map(({ href, icon: Icon, tag, title, blurb }) => (
            <Link
              key={href}
              href={href}
              className="frame-brass group relative flex flex-col rounded-sm bg-surface p-6 transition-weighted hover:bg-surface-2 hover:shadow-[0_0_24px_-4px_color-mix(in_oklab,var(--brass)_45%,transparent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass"
            >
              <div className="flex items-center justify-between">
                <Icon
                  className="h-7 w-7 text-verdigris transition-weighted group-hover:text-brass"
                  strokeWidth={1.5}
                />
                <span className="font-label text-[10px] tracking-widest text-brass-dim uppercase">
                  {tag}
                </span>
              </div>
              <h3 className="font-display mt-5 text-xl text-parchment">
                {title}
              </h3>
              <p className="font-body mt-3 text-sm leading-relaxed text-parchment-dim">
                {blurb}
              </p>
              <span className="font-label mt-6 text-xs tracking-widest text-brass uppercase opacity-0 transition-weighted group-hover:opacity-100">
                Enter &rarr;
              </span>
            </Link>
          ))}
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <DecoDivider />
      </div>

      {/* Bug reports + support */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-2">
          <div className="frame-brass rounded-sm bg-surface p-6 sm:p-8">
            <div className="flex items-center gap-2.5">
              <Bug className="h-5 w-5 text-oxblood" strokeWidth={1.5} />
              <h2 className="font-display text-xl text-parchment">
                Found a bug or an issue? Report it here.
              </h2>
            </div>
            <p className="font-body mt-2 text-sm text-parchment-dim">
              ScrimLock is in beta — something&apos;s going to break. Tell me
              what happened and I&apos;ll fix it.
            </p>
            <div className="mt-6">
              <BugReportForm />
            </div>
          </div>

          <div className="frame-brass flex flex-col items-start rounded-sm bg-surface p-6 sm:p-8">
            <div className="flex items-center gap-2.5">
              <Coffee className="h-5 w-5 text-brass" strokeWidth={1.5} />
              <h2 className="font-display text-xl text-parchment">
                Support the project
              </h2>
            </div>
            <p className="font-body mt-2 text-sm text-parchment-dim">
              ScrimLock is free and independently run. If it&apos;s useful to
              you, buying me a coffee helps keep it running.
            </p>
            <Link
              href={PAYPAL_DONATE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                buttonVariants({ size: "lg" }),
                "bg-brass text-primary-foreground hover:bg-brass/90 mt-6",
              )}
            >
              <Coffee className="h-4 w-4" />
              Buy Me a Coffee
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
