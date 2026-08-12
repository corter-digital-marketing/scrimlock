import Link from "next/link";
import { Trophy, Swords, UserSearch, Clock3, ShieldCheck, Users2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { SigilMark } from "@/components/site/sigil-mark";
import { DecoDivider } from "@/components/site/deco-divider";
import { RankBadge } from "@/components/site/rank-badge";
import { RANKS } from "@/lib/ranks";

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

const features = [
  {
    icon: ShieldCheck,
    title: "Real access control",
    blurb:
      "Every table is row-level secured in Postgres. The anon key is public — the database enforces who can see and touch what, not the UI.",
  },
  {
    icon: Users2,
    title: "6v6, subs included",
    blurb:
      "Rosters are built around Deadlock's 6-player format, with room for substitutes and no invented role system.",
  },
  {
    icon: Clock3,
    title: "Your local time, always",
    blurb:
      "Scrim and tournament times are stored in UTC and rendered in your timezone — critical when the ladder spans every region.",
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
            <h1 className="font-display mt-4 text-5xl leading-[1.05] tracking-tight text-parchment sm:text-6xl">
              Tournaments, scrims, and{" "}
              <span className="text-brass text-glow-brass">teammates.</span>
            </h1>
            <p className="font-body mt-6 text-lg leading-relaxed text-parchment-dim">
              Deadlock Esports is where the community organizes tournaments,
              arranges scrims, and finds teammates. One profile, one rank,
              three ways to compete.
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
                href="/tournaments"
                className={cn(
                  buttonVariants({ size: "lg", variant: "outline" }),
                  "border-brass-dim text-parchment hover:bg-surface-2 hover:text-brass",
                )}
              >
                Browse Tournaments
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Three tabs */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="font-label text-xs tracking-[0.35em] text-verdigris uppercase">
            Three ways in
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

      {/* Rank ladder showcase */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="font-label text-xs tracking-[0.35em] text-verdigris uppercase">
            Obscurus to Eternus
          </p>
          <h2 className="font-display mt-3 text-3xl text-parchment sm:text-4xl">
            The Ranked Ladder
          </h2>
          <p className="font-body mx-auto mt-4 max-w-xl text-parchment-dim">
            Every profile shows a rank badge. Filters across Tournaments,
            Scrims, and LFT all sort along this ladder.
          </p>
        </div>

        <div className="mt-12 flex flex-wrap justify-center gap-x-6 gap-y-8">
          {RANKS.map((rank) => (
            <RankBadge
              key={rank.id}
              rankName={rank.name}
              subrank={rank.isPlacement ? null : ((rank.id % 6) + 1)}
            />
          ))}
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <DecoDivider />
      </div>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, blurb }) => (
            <div key={title} className="flex gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-brass-dim bg-surface">
                <Icon className="h-5 w-5 text-brass" strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="font-display text-lg text-parchment">
                  {title}
                </h3>
                <p className="font-body mt-2 text-sm leading-relaxed text-parchment-dim">
                  {blurb}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
