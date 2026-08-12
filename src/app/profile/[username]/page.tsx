import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProfileByUsername } from "@/lib/supabase/profiles";
import { getHeroesByIds } from "@/lib/supabase/heroes";
import { getCurrentUser } from "@/lib/supabase/auth";
import { getRankById } from "@/lib/ranks";
import { RankBadge } from "@/components/site/rank-badge";
import { DecoDivider } from "@/components/site/deco-divider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Params = Promise<{ username: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { username } = await params;
  return { title: `@${username}` };
}

export default async function ProfilePage({ params }: { params: Params }) {
  const { username } = await params;
  const [profile, currentUser] = await Promise.all([
    getProfileByUsername(username),
    getCurrentUser(),
  ]);

  if (!profile) notFound();

  const preferredHeroes = await getHeroesByIds(profile.preferred_heroes);
  const rank = getRankById(profile.rank_id);
  const isOwnProfile = currentUser?.id === profile.id;
  const initials = (profile.display_name || profile.username)
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="frame-brass rounded-sm bg-surface px-6 py-8 sm:px-10">
        <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:items-start sm:text-left">
          <Avatar className="h-24 w-24 border border-brass-dim">
            {profile.avatar_url ? (
              <AvatarImage src={profile.avatar_url} alt="" />
            ) : null}
            <AvatarFallback className="font-display bg-surface-2 text-3xl text-brass">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="font-display text-3xl text-parchment">
                  {profile.display_name}
                </h1>
                <p className="font-label text-xs tracking-widest text-parchment-dim uppercase">
                  @{profile.username}
                </p>
              </div>
              {isOwnProfile ? (
                <Link
                  href="/settings/profile"
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "border-brass-dim",
                  )}
                >
                  Edit Profile
                </Link>
              ) : null}
            </div>

            <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
              {profile.is_lft ? (
                <span className="font-label rounded-full border border-verdigris bg-verdigris/10 px-2.5 py-1 text-[10px] tracking-widest text-verdigris uppercase">
                  Looking for team
                </span>
              ) : null}
              {profile.region ? (
                <span className="font-label rounded-full border border-brass-dim/50 px-2.5 py-1 text-[10px] tracking-widest text-parchment-dim uppercase">
                  {profile.region}
                </span>
              ) : null}
              {profile.discord_handle ? (
                <span className="font-label rounded-full border border-brass-dim/50 px-2.5 py-1 text-[10px] tracking-widest text-parchment-dim uppercase">
                  Discord: {profile.discord_handle}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {profile.bio ? (
          <p className="font-body mt-6 text-parchment-dim">{profile.bio}</p>
        ) : null}

        <DecoDivider className="my-8" />

        <div className="grid gap-8 sm:grid-cols-[auto_1fr]">
          <div>
            <p className="font-label mb-3 text-xs tracking-widest text-brass-dim uppercase">
              Rank
            </p>
            {rank ? (
              <RankBadge
                rankName={rank.name}
                iconSrc={rank.icon}
                subrank={profile.rank_subrank}
                size="lg"
              />
            ) : (
              <p className="font-body text-sm text-parchment-dim">Not set</p>
            )}
          </div>

          <div>
            <p className="font-label mb-3 text-xs tracking-widest text-brass-dim uppercase">
              Preferred heroes
            </p>
            {preferredHeroes.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {preferredHeroes.map((hero) => (
                  <span
                    key={hero.id}
                    className="font-label rounded-full border border-brass-dim/50 px-2.5 py-1 text-[11px] tracking-wide text-parchment uppercase"
                  >
                    {hero.name}
                  </span>
                ))}
              </div>
            ) : (
              <p className="font-body text-sm text-parchment-dim">
                None listed
              </p>
            )}

            {profile.playstyle_note ? (
              <p className="font-body mt-3 text-sm text-parchment-dim italic">
                &ldquo;{profile.playstyle_note}&rdquo;
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
